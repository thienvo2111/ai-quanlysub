// Google Apps Script - REST API cho Quan Ly Goi AI Family
// Deploy as Web App: Execute as "Me", Access: "Anyone"

const SHEET_PACKAGES = 'Packages'
const SHEET_MEMBERS = 'Members'

const PKG_HEADERS = ['id', 'name', 'ownerEmail', 'cost', 'purchaseDate', 'expiryDate', 'notes']
const MEM_HEADERS = ['id', 'name', 'email', 'phone', 'paymentAmount', 'duration', 'startDate', 'expiryDate', 'packageId']

function doGet(e) {
  const sheet = e.parameter.sheet
  try {
    const data = readSheet(sheet)
    return jsonResponse({ ok: true, data })
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message })
  }
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
  sheet.clearContents()
  sheet.appendRow(headers)

  data.forEach(item => {
    sheet.appendRow(headers.map(h => item[h] !== undefined ? item[h] : ''))
  })
}

function initSheet(ss, sheetName) {
  const sheet = ss.insertSheet(sheetName)
  const headers = sheetName === SHEET_PACKAGES ? PKG_HEADERS : MEM_HEADERS
  sheet.appendRow(headers)
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285F4').setFontColor('#ffffff')
  sheet.setFrozenRows(1)
  return sheet
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
