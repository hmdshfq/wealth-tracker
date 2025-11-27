import React from 'react';
import styles from './DataTable.module.css';

interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  footer?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  footer,
}: DataTableProps<T>) {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`${styles.headerCell} ${styles[col.align || 'left']}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={keyExtractor(item, index)} className={styles.bodyRow}>
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={`${styles.bodyCell} ${styles[col.align || 'left']}`}
                >
                  {col.render
                    ? col.render(item, index)
                    : String(item[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className={styles.footer}>{footer}</tfoot>}
      </table>
    </div>
  );
}

export default DataTable;
