import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  type: text('type').notNull(),
  payload: text('payload').notNull(),
}, table => [uniqueIndex('attendance_type_date').on(table.type, table.date)]);

export const calendarEvents = sqliteTable('calendar_events', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  time: text('time').notNull().default(''),
  location: text('location').notNull().default(''),
  note: text('note').notNull().default(''),
});
export const calendarCategories = sqliteTable('calendar_categories', {
  name: text('name').primaryKey(),
});
