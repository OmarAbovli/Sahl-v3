import * as XLSX from "xlsx"

export function exportToExcel(data: any[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportFinancialStatement(
    balanceSheet: any,
    incomeStatement: any,
    filename: string
) {
    const wb = XLSX.utils.book_new()

    // 1. Balance Sheet
    const bsData = [
        ["Balance Sheet"],
        [""],
        ["ASSETS"],
        ...balanceSheet.assets.map((a: any) => [a.code, a.name, a.balance]),
        ["Total Assets", "", balanceSheet.totalAssets],
        [""],
        ["LIABILITIES"],
        ...balanceSheet.liabilities.map((l: any) => [l.code, l.name, l.balance]),
        ["Total Liabilities", "", balanceSheet.totalLiabilities],
        [""],
        ["EQUITY"],
        ...balanceSheet.equity.map((e: any) => [e.code, e.name, e.balance]),
        ["Total Equity", "", balanceSheet.totalEquity],
    ]
    const wsBS = XLSX.utils.aoa_to_sheet(bsData)
    XLSX.utils.book_append_sheet(wb, wsBS, "Balance Sheet")

    // 2. Income Statement
    // Assuming incomeStatement is { revenue: #, expenses: #, netProfit: # }
    const isData = [
        ["Income Statement"],
        [""],
        ["Revenue", incomeStatement.revenue],
        ["Expenses", incomeStatement.expenses],
        ["Net Profit", incomeStatement.netProfit],
        ["Profit Margin", `${incomeStatement.profitMargin?.toFixed(2)}%`]
    ]
    const wsIS = XLSX.utils.aoa_to_sheet(isData)
    XLSX.utils.book_append_sheet(wb, wsIS, "Income Statement")

    XLSX.writeFile(wb, `${filename}.xlsx`)
}
