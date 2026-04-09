// ===== Eclatrecon AI Mail — PostgreSQL Supabase-Compatible Wrapper =====
// Drop-in replacement for @supabase/supabase-js .from() API
// Uses local PostgreSQL via 'pg' package — same API, 50-100x faster

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = new Pool({
    host: process.env.PG_HOST || '127.0.0.1',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'eclatrecon_mail',
    user: process.env.PG_USER || 'eclatrecon_mail',
    password: process.env.PG_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
});

// ===== Supabase-Compatible Query Builder =====
class QueryBuilder {
    constructor(pool, tableName) {
        this._pool = pool;
        this._table = tableName;
        this._type = null; // select, insert, update, delete
        this._selectCols = '*';
        this._countMode = null; // null, 'exact'
        this._headOnly = false;
        this._conditions = [];
        this._params = [];
        this._paramIdx = 0;
        this._insertData = null;
        this._updateData = null;
        this._upsertData = null;
        this._upsertConflict = null;
        this._orderBy = [];
        this._limitVal = null;
        this._offsetVal = null;
        this._singleMode = false;
        this._maybeMode = false;
        this._joins = []; // For relational selects like 'campaigns(name)'
        this._orFilters = [];
    }

    _addParam(val) {
        this._paramIdx++;
        this._params.push(val);
        return `$${this._paramIdx}`;
    }

    // ===== Operations =====
    select(cols, opts) {
        this._type = 'select';
        if (opts && opts.count === 'exact') {
            this._countMode = 'exact';
        }
        if (opts && opts.head) {
            this._headOnly = true;
        }
        if (cols && cols !== '*') {
            // Parse relational selects: '*, campaigns(name), users(email, name)'
            const parts = cols.split(/,(?![^(]*\))/).map(c => c.trim());
            const directCols = [];
            for (const p of parts) {
                const joinMatch = p.match(/^(\w+)\((.+)\)$/);
                if (joinMatch) {
                    this._joins.push({ table: joinMatch[1], cols: joinMatch[2] });
                } else {
                    directCols.push(p);
                }
            }
            this._selectCols = directCols.length > 0 ? directCols.join(', ') : '*';
        } else {
            this._selectCols = '*';
        }
        return this;
    }

    insert(data) {
        this._type = 'insert';
        this._insertData = Array.isArray(data) ? data : [data];
        return this;
    }

    upsert(data, opts) {
        this._type = 'upsert';
        this._upsertData = Array.isArray(data) ? data : [data];
        this._upsertConflict = opts?.onConflict || 'id';
        return this;
    }

    update(data) {
        this._type = 'update';
        this._updateData = data;
        return this;
    }

    delete() {
        this._type = 'delete';
        return this;
    }

    // ===== Filters =====
    eq(col, val) {
        if (val === null) {
            this._conditions.push(`"${col}" IS NULL`);
        } else {
            this._conditions.push(`"${col}" = ${this._addParam(val)}`);
        }
        return this;
    }

    neq(col, val) {
        if (val === null) {
            this._conditions.push(`"${col}" IS NOT NULL`);
        } else {
            this._conditions.push(`"${col}" != ${this._addParam(val)}`);
        }
        return this;
    }

    gt(col, val) {
        this._conditions.push(`"${col}" > ${this._addParam(val)}`);
        return this;
    }

    gte(col, val) {
        this._conditions.push(`"${col}" >= ${this._addParam(val)}`);
        return this;
    }

    lt(col, val) {
        this._conditions.push(`"${col}" < ${this._addParam(val)}`);
        return this;
    }

    lte(col, val) {
        this._conditions.push(`"${col}" <= ${this._addParam(val)}`);
        return this;
    }

    like(col, val) {
        this._conditions.push(`"${col}" LIKE ${this._addParam(val)}`);
        return this;
    }

    ilike(col, val) {
        this._conditions.push(`"${col}" ILIKE ${this._addParam(val)}`);
        return this;
    }

    is(col, val) {
        if (val === null) {
            this._conditions.push(`"${col}" IS NULL`);
        } else if (val === true) {
            this._conditions.push(`"${col}" IS TRUE`);
        } else if (val === false) {
            this._conditions.push(`"${col}" IS FALSE`);
        }
        return this;
    }

    in(col, vals) {
        if (!vals || vals.length === 0) {
            this._conditions.push('FALSE'); // No matches for empty array
            return this;
        }
        const placeholders = vals.map(v => this._addParam(v));
        this._conditions.push(`"${col}" IN (${placeholders.join(', ')})`);
        return this;
    }

    not(col, op, val) {
        if (op === 'in') {
            const placeholders = (val || []).map(v => this._addParam(v));
            this._conditions.push(`"${col}" NOT IN (${placeholders.join(', ')})`);
        } else if (op === 'eq') {
            this._conditions.push(`"${col}" != ${this._addParam(val)}`);
        } else if (op === 'is') {
            if (val === null) this._conditions.push(`"${col}" IS NOT NULL`);
        }
        return this;
    }

    contains(col, val) {
        // For JSONB contains or array contains
        this._conditions.push(`"${col}" @> ${this._addParam(JSON.stringify(val))}::jsonb`);
        return this;
    }

    or(filterStr) {
        // Parse simple or filters like "email.eq.test@example.com,name.eq.Test"
        const parts = filterStr.split(',');
        const ors = parts.map(part => {
            const [col, op, ...rest] = part.split('.');
            const val = rest.join('.');
            switch (op) {
                case 'eq': return `"${col}" = ${this._addParam(val)}`;
                case 'neq': return `"${col}" != ${this._addParam(val)}`;
                case 'like': return `"${col}" LIKE ${this._addParam(val)}`;
                case 'ilike': return `"${col}" ILIKE ${this._addParam(val)}`;
                case 'gt': return `"${col}" > ${this._addParam(val)}`;
                case 'gte': return `"${col}" >= ${this._addParam(val)}`;
                case 'lt': return `"${col}" < ${this._addParam(val)}`;
                case 'lte': return `"${col}" <= ${this._addParam(val)}`;
                case 'is': return val === 'null' ? `"${col}" IS NULL` : `"${col}" IS ${val}`;
                default: return `"${col}" = ${this._addParam(val)}`;
            }
        });
        if (ors.length > 0) {
            this._conditions.push(`(${ors.join(' OR ')})`);
        }
        return this;
    }

    textSearch(col, query) {
        // For search_vector, search across subject + body_text
        if (col === 'search_vector') {
            this._conditions.push(`to_tsvector('english', COALESCE("subject",'') || ' ' || COALESCE("body_text",'') || ' ' || COALESCE("from_address",'')) @@ plainto_tsquery('english', ${this._addParam(query)})`);
        } else {
            this._conditions.push(`to_tsvector('english', "${col}") @@ plainto_tsquery('english', ${this._addParam(query)})`);
        }
        return this;
    }

    // ===== Modifiers =====
    order(col, opts) {
        const dir = opts?.ascending === false ? 'DESC' : 'ASC';
        const nulls = opts?.nullsFirst ? 'NULLS FIRST' : '';
        this._orderBy.push(`"${col}" ${dir} ${nulls}`.trim());
        return this;
    }

    limit(n) {
        this._limitVal = n;
        return this;
    }

    range(from, to) {
        this._offsetVal = from;
        this._limitVal = to - from + 1;
        return this;
    }

    single() {
        this._singleMode = true;
        this._limitVal = 1;
        return this;
    }

    maybeSingle() {
        this._maybeMode = true;
        this._singleMode = true;
        this._limitVal = 1;
        return this;
    }

    // ===== Execution =====
    async then(resolve, reject) {
        try {
            const result = await this._execute();
            resolve(result);
        } catch (err) {
            if (reject) reject(err);
            else resolve({ data: null, error: { message: err.message, code: err.code } });
        }
    }

    async _execute() {
        try {
            switch (this._type) {
                case 'select': return await this._execSelect();
                case 'insert': return await this._execInsert();
                case 'upsert': return await this._execUpsert();
                case 'update': return await this._execUpdate();
                case 'delete': return await this._execDelete();
                default: return { data: null, error: { message: 'No operation specified' } };
            }
        } catch (err) {
            return { data: null, error: { message: err.message, code: err.code || 'UNKNOWN' }, count: null };
        }
    }

    _buildWhere() {
        return this._conditions.length > 0 ? ' WHERE ' + this._conditions.join(' AND ') : '';
    }

    _buildOrderLimit() {
        let sql = '';
        if (this._orderBy.length > 0) sql += ` ORDER BY ${this._orderBy.join(', ')}`;
        if (this._limitVal != null) sql += ` LIMIT ${this._limitVal}`;
        if (this._offsetVal != null) sql += ` OFFSET ${this._offsetVal}`;
        return sql;
    }

    async _execSelect() {
        if (this._countMode === 'exact' && this._headOnly) {
            // Count-only query
            const sql = `SELECT COUNT(*) as count FROM "${this._table}"${this._buildWhere()}`;
            const result = await this._pool.query(sql, this._params);
            return { data: null, error: null, count: parseInt(result.rows[0].count) };
        }

        let selectPart = this._selectCols;
        const sql = `SELECT ${selectPart} FROM "${this._table}"${this._buildWhere()}${this._buildOrderLimit()}`;
        const result = await this._pool.query(sql, this._params);

        let data = result.rows;

        // Handle relational joins
        if (this._joins && this._joins.length > 0) {
            for (const join of this._joins) {
                const joinTable = join.table;
                const joinCols = join.cols;
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    // Try common FK patterns: user_id, plan_id, campaign_id, etc.
                    const singular = joinTable.replace(/s$/, '');
                    const fk = row[`${singular}_id`] || row[`${joinTable}_id`];
                    if (fk) {
                        try {
                            const joinSql = `SELECT ${joinCols} FROM "${joinTable}" WHERE "id" = $1 LIMIT 1`;
                            const joinResult = await this._pool.query(joinSql, [fk]);
                            data[i][joinTable] = joinResult.rows[0] || null;
                        } catch (e) {
                            data[i][joinTable] = null;
                        }
                    } else {
                        data[i][joinTable] = null;
                    }
                }
            }
        }

        if (this._singleMode) {
            if (data.length === 0) {
                if (this._maybeMode) return { data: null, error: null };
                return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
            }
            return { data: data[0], error: null };
        }

        const response = { data, error: null };
        if (this._countMode === 'exact') {
            // Get count alongside data
            const countSql = `SELECT COUNT(*) as count FROM "${this._table}"${this._buildWhere()}`;
            // Re-run with same params (need fresh copy since params are consumed)
            const countResult = await this._pool.query(countSql, this._params);
            response.count = parseInt(countResult.rows[0].count);
        }
        return response;
    }

    async _execInsert() {
        if (!this._insertData || this._insertData.length === 0) {
            return { data: null, error: null };
        }

        const rows = this._insertData;
        const allKeys = [...new Set(rows.flatMap(r => Object.keys(r)))];
        const colNames = allKeys.map(k => `"${k}"`).join(', ');

        const valueSets = [];
        const allParams = [];
        let pIdx = 0;

        for (const row of rows) {
            const placeholders = allKeys.map(k => {
                pIdx++;
                const val = row[k] !== undefined ? row[k] : null;
                allParams.push(typeof val === 'object' && val !== null && !(val instanceof Date) ? JSON.stringify(val) : val);
                return `$${pIdx}`;
            });
            valueSets.push(`(${placeholders.join(', ')})`);
        }

        const sql = `INSERT INTO "${this._table}" (${colNames}) VALUES ${valueSets.join(', ')} RETURNING *`;
        const result = await this._pool.query(sql, allParams);
        return { data: result.rows.length === 1 ? result.rows[0] : result.rows, error: null };
    }

    async _execUpsert() {
        if (!this._upsertData || this._upsertData.length === 0) {
            return { data: null, error: null };
        }

        const rows = this._upsertData;
        const allKeys = [...new Set(rows.flatMap(r => Object.keys(r)))];
        const colNames = allKeys.map(k => `"${k}"`).join(', ');
        const conflictCols = this._upsertConflict.split(',').map(c => `"${c.trim()}"`).join(', ');
        const updateCols = allKeys.filter(k => !this._upsertConflict.split(',').map(c => c.trim()).includes(k));
        const updateSet = updateCols.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

        const valueSets = [];
        const allParams = [];
        let pIdx = 0;

        for (const row of rows) {
            const placeholders = allKeys.map(k => {
                pIdx++;
                const val = row[k] !== undefined ? row[k] : null;
                allParams.push(typeof val === 'object' && val !== null && !(val instanceof Date) ? JSON.stringify(val) : val);
                return `$${pIdx}`;
            });
            valueSets.push(`(${placeholders.join(', ')})`);
        }

        const sql = `INSERT INTO "${this._table}" (${colNames}) VALUES ${valueSets.join(', ')} ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateSet} RETURNING *`;
        const result = await this._pool.query(sql, allParams);
        return { data: result.rows, error: null };
    }

    async _execUpdate() {
        if (!this._updateData) return { data: null, error: null };

        const keys = Object.keys(this._updateData);
        const setClauses = [];
        const updateParams = [];
        let pIdx = 0;

        for (const k of keys) {
            pIdx++;
            const val = this._updateData[k];
            updateParams.push(typeof val === 'object' && val !== null && !(val instanceof Date) ? JSON.stringify(val) : val);
            setClauses.push(`"${k}" = $${pIdx}`);
        }

        // Adjust condition param indices
        const adjustedConditions = this._conditions.map(cond => {
            return cond.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + pIdx}`);
        });

        const allParams = [...updateParams, ...this._params];
        const whereClause = adjustedConditions.length > 0 ? ' WHERE ' + adjustedConditions.join(' AND ') : '';
        const sql = `UPDATE "${this._table}" SET ${setClauses.join(', ')}${whereClause} RETURNING *`;
        const result = await this._pool.query(sql, allParams);
        return { data: result.rows, error: null };
    }

    async _execDelete() {
        const sql = `DELETE FROM "${this._table}"${this._buildWhere()} RETURNING *`;
        const result = await this._pool.query(sql, this._params);
        return { data: result.rows, error: null };
    }
}

// ===== Supabase-Compatible Client =====
class PgSupabaseClient {
    constructor(pool) {
        this._pool = pool;
    }

    from(table) {
        return new QueryBuilder(this._pool, table);
    }

    // RPC support (for stored procedures)
    async rpc(funcName, params) {
        try {
            const paramKeys = Object.keys(params || {});
            const paramVals = paramKeys.map(k => params[k]);
            const placeholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ');
            const sql = `SELECT ${funcName}(${placeholders})`;
            const result = await this._pool.query(sql, paramVals);
            return { data: result.rows[0], error: null };
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    }

    // Raw SQL (escape hatch)
    async raw(sql, params) {
        const result = await this._pool.query(sql, params || []);
        return { data: result.rows, error: null };
    }
}

const supabase = new PgSupabaseClient(pool);

module.exports = { pool, supabase, PgSupabaseClient };
