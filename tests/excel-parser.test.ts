import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import { parseExcelWorkbook, mapRawOutcomeToCategory } from '../src/lib/excel-import'
import { normalizeRegisterNumber, isValidMobileNumber, formatMobileNumber } from '../src/lib/utils'

describe('Excel Parser & Normalization Engine', () => {
  it('normalizes register numbers by trimming and uppercasing', () => {
    assert.strictEqual(normalizeRegisterNumber(' 22bai1452 '), '22BAI1452')
    assert.strictEqual(normalizeRegisterNumber('22bce1741'), '22BCE1741')
    assert.strictEqual(normalizeRegisterNumber(' 22BPS1039  '), '22BPS1039')
  })

  it('correctly maps raw Google Forms selection values to standard NIRF categories', () => {
    assert.strictEqual(mapRawOutcomeToCategory('Placement and Entrepreneur'), 'full_time_employment')
    assert.strictEqual(mapRawOutcomeToCategory('Higher Studies'), 'higher_studies')
    assert.strictEqual(mapRawOutcomeToCategory('Planning to Become an Entrepreneur / Start a Business'), 'entrepreneurship')
    assert.strictEqual(mapRawOutcomeToCategory('Not Placed – Preparing for Placement'), 'no_confirmed_outcome')
    assert.strictEqual(mapRawOutcomeToCategory('Preparing for Higher Studies / Entrance Examinations'), 'higher_studies')
  })

  it('validates mobile numbers correctly', () => {
    assert.strictEqual(isValidMobileNumber('8667431089'), true)
    assert.strictEqual(isValidMobileNumber('+919845091711'), true)
    assert.strictEqual(isValidMobileNumber('#ERROR!'), false)
    assert.strictEqual(isValidMobileNumber('No pending students'), false)
    assert.strictEqual(isValidMobileNumber(null), false)
  })

  it('formats mobile numbers with standard country code prefix', () => {
    assert.strictEqual(formatMobileNumber('8667431089'), '+918667431089')
    assert.strictEqual(formatMobileNumber('+919845091711'), '+919845091711')
    assert.strictEqual(formatMobileNumber(null), 'N/A')
  })

  it('successfully loads and parses the official NIRF 2027 workbook', async () => {
    const workbookPath = path.join(process.cwd(), 'public', 'NIRF_2027_Responses.xlsx')
    assert.strictEqual(fs.existsSync(workbookPath), true)

    const buffer = fs.readFileSync(workbookPath)
    const result = await parseExcelWorkbook(buffer, 'NIRF_2027_Responses.xlsx')

    assert.strictEqual(result.total_students, 929)
    assert.strictEqual(result.total_responses, 382)
    assert.strictEqual(result.matched_responses_count, 257)
    assert.strictEqual(result.unmatched_responses_count, 125)
    assert.strictEqual(result.duplicate_register_numbers.length, 0)
  })
})
