// tests/dbSecurity.test.ts
import { describe, expect, it } from '@jest/globals'
import { prisma } from '../src/utils/prisma'

describe('Database Security', () => {
  it('app_user cannot create tables', async () => {
    await expect(
      prisma.$executeRaw`CREATE TABLE test_table (id int)`
    ).rejects.toThrow()
  })
  
  it('app_user cannot drop tables', async () => {
    await expect(
      prisma.$executeRaw`DROP TABLE poems`
    ).rejects.toThrow()
  })
  
  it('app_user cannot alter tables', async () => {
    await expect(
      prisma.$executeRaw`ALTER TABLE poems ADD COLUMN test_col int`
    ).rejects.toThrow()
  })
  
  it('app_user cannot create functions', async () => {
    await expect(
      prisma.$executeRaw`CREATE OR REPLACE FUNCTION test() RETURNS int AS $$ SELECT 1 $$ LANGUAGE SQL`
    ).rejects.toThrow()
  })
})