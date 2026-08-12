// tests/dbSecurity.test.ts

import { describe, expect, it } from '@jest/globals'
import { prisma } from '../src/utils/prisma'

// Suite de teste pentru securitatea bazei de date
describe('Database Security', () => {

  // Testează că utilizatorul "app_user" NU are permisiunea de a crea tabele
  it('app_user cannot create tables', async () => {
    await expect(
      prisma.$executeRaw`CREATE TABLE test_table (id int)`
    ).rejects.toThrow()   // ne așteptăm să arunce eroare → deci permisiunea este blocată
  })
  
  // Testează că utilizatorul "app_user" NU poate șterge tabele
  it('app_user cannot drop tables', async () => {
    await expect(
      prisma.$executeRaw`DROP TABLE poems`
    ).rejects.toThrow()   // trebuie să arunce eroare → securitatea funcționează
  })
  
  // Testează că utilizatorul "app_user" NU poate modifica structura tabelelor
  it('app_user cannot alter tables', async () => {
    await expect(
      prisma.$executeRaw`ALTER TABLE poems ADD COLUMN test_col int`
    ).rejects.toThrow()   // alter table este interzis → testul confirmă acest lucru
  })
  
  // Testează că utilizatorul "app_user" NU poate crea funcții SQL
  it('app_user cannot create functions', async () => {
    await expect(
      prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION test() RETURNS int AS $$ SELECT 1 $$ LANGUAGE SQL
      `
    ).rejects.toThrow()   // crearea funcțiilor este interzisă → trebuie să arunce eroare
  })
})
