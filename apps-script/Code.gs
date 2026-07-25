// Google Apps Script - REST API cho Quan Ly Goi AI Family
// Deploy as Web App: Execute as "Me", Access: "Anyone"

const SHEET_PACKAGES = 'Packages'
const SHEET_MEMBERS = 'Members'

const PKG_HEADERS = ['id', 'name', 'ownerEmail', 'cost', 'purchaseDate', 'expiryDate', 'notes']
const MEM_HEADERS = ['id', 'name', 'email', 'phone', 'paymentAmount', 'duration', 'startDate', 'expiryDate', 'packageId', 'archived']

function doGet(e) {
  const action = e.parameter.action
  if (action === 'reset') {
    try {
      resetSheets()
      return jsonResponse({ ok: true, message: 'Sheets reset OK' })
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message })
    }
  }
  const sheet = e.parameter.sheet
  try {
    const data = readSheet(sheet)
    return jsonResponse({ ok: true, data })
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message })
  }
}

function resetSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ;[SHEET_PACKAGES, SHEET_MEMBERS].forEach(name => {
    const existing = ss.getSheetByName(name)
    if (existing) ss.deleteSheet(existing)
    initSheet(ss, name)
  })
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const { sheet, data } = body
    writeSheet(sheet, data)
    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message })
  }
}

function readSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(sheetName)
  if (!sheet) {
    sheet = initSheet(ss, sheetName)
    return []
  }
  const rows = sheet.getDataRange().getValues()
  if (rows.length <= 1) return []
  const headers = rows[0]
  return rows.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] })
    return obj
  })
}

function writeSheet(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(sheetName)
  if (!sheet) sheet = initSheet(ss, sheetName)

  const headers = sheetName === SHEET_PACKAGES ? PKG_HEADERS : MEM_HEADERS
  const rows = [headers].concat(
    data.map(item => headers.map(h => (item[h] !== undefined && item[h] !== null) ? String(item[h]) : ''))
  )

  // Xoa toan bo noi dung
  sheet.clearContents()

  // Ghi truc tiep tu o A1 thay vi dung appendRow (tranh bug vi tri sai)
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows)

  // Format header row
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285F4')
    .setFontColor('#ffffff')
  sheet.setFrozenRows(1)
}

function initSheet(ss, sheetName) {
  const sheet = ss.insertSheet(sheetName)
  const headers = sheetName === SHEET_PACKAGES ? PKG_HEADERS : MEM_HEADERS
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285F4').setFontColor('#ffffff')
  sheet.setFrozenRows(1)
  return sheet
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
