// custom-logger.ts
import { Logger, QueryRunner } from 'typeorm';
import { highlight } from 'sql-highlight';
import { format } from 'sql-formatter';

export class CustomQueryLogger implements Logger {
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1초

  private formatQuery(query: string, parameters?: any[]): string {
    let formattedQuery = format(query, {
      language: 'mysql',
      keywordCase: 'upper'
    });

    if (parameters?.length) {
      // ? 를 찾아서 순서대로 파라미터 값으로 대체
      let parameterIndex = 0;
      formattedQuery = formattedQuery.replace(/\?/g, () => {
        const param = parameters[parameterIndex++];
        return typeof param === 'string' ? `'${param}'` : param;
      });
    }

    return formattedQuery;
  }

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    // EXPLAIN 쿼리는 로깅하지 않음
    // 이미 logQueryPlan 여기에서 실행 계획을 출력했기 때문
    if (query.trim().toUpperCase().startsWith('EXPLAIN')) {
      return;
    }

    const formattedQuery = this.formatQuery(query, parameters);
    console.log('\n🔍 Query:');
    console.log(highlight(formattedQuery));

    // SELECT 쿼리에 대해서만 실행 계획 출력
    if (query.trim().toUpperCase().startsWith('SELECT') && queryRunner) {
      this.logQueryPlan(query, parameters, queryRunner);
    }
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    const formattedQuery = this.formatQuery(query, parameters);

    console.error('\n❌ Query Error:');
    console.error(highlight(formattedQuery));
    console.error('Error:', error);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    const formattedQuery = this.formatQuery(query, parameters);

    console.warn(`\n⚠️ Slow Query (${time}ms):`);
    console.warn(highlight(formattedQuery));

    if (parameters?.length) {
      console.warn('Parameters:', parameters);
    }
  }

  logSchemaBuild(message: string) {
    console.log('\n🏗 Schema Build:', message);
  }

  logMigration(message: string) {
    console.log('\n🔄 Migration:', message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    switch (level) {
      case 'log':
        console.log('\nℹ️ Log:', message);
        break;
      case 'info':
        console.info('\nℹ️ Info:', message);
        break;
      case 'warn':
        console.warn('\n⚠️ Warning:', message);
        break;
    }
  }

  private async logQueryPlan(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    try {
      // SELECT 쿼리인 경우에만 실행 계획 출력
      if (!query.trim().toUpperCase().startsWith('SELECT')) {
        console.log('\n📝 DML Query - No execution plan available');
        return;
      }

      // 파라미터 출력 추가
      if (parameters?.length) {
        console.log('\n📍 Parameters:', parameters);
      }

      const explainQuery = `EXPLAIN FORMAT=JSON ${query}`;
      const queryPlan = await queryRunner?.query(explainQuery, parameters);

      if (queryPlan && queryPlan.length > 0) {
        const parsedPlan = JSON.parse(queryPlan[0].EXPLAIN);
        console.log('\n📊 Query Plan:');
        this.logPlanSummary(parsedPlan.query_block);
      }
    } catch (error) {
      console.error('\n❌ Failed to get query plan:', error);
    }
  }

  private logPlanSummary(queryBlock: any) {
    try {
      // cost_info가 있는 경우에만 출력
      if (queryBlock?.cost_info?.query_cost) {
        console.log(`\nQuery Cost: ${queryBlock.cost_info.query_cost}`);
      }

      // nested_loop가 있는 경우에만 출력
      const nestedLoop = queryBlock?.ordering_operation?.nested_loop
        || queryBlock?.nested_loop
        || [];

      nestedLoop.forEach((loop: any) => {
        const table = loop.table;
        if (!table) return;

        console.log(`\nTable: ${table.table_name || 'Unknown'}`);
        console.log(`Access Type: ${table.access_type || 'Unknown'}`);
        console.log(`Rows Examined: ${table.rows_examined_per_scan || 0}`);
        console.log(`Filtered: ${table.filtered || 0}%`);

        if (table.possible_keys) {
          console.log(`Used Index: ${table.key || 'None'}`);
        }

        if (table.cost_info?.read_cost) {
          console.log(`Read Cost: ${table.cost_info.read_cost}`);
        }
      });
    } catch (error) {
      console.error('Error in logPlanSummary:', error);
    }
  }
}