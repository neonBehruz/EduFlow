$loginRaw = curl.exe -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\`"email\`":\`"superadmin@eduflow.uz\`",\`"password\`":\`"admin123\`"}" -s
$login = ConvertFrom-Json -InputObject $loginRaw
$token = $login.data.token
Write-Host "Logged in. Token acquired."

$studentsRaw = curl.exe http://localhost:5000/api/students -H "Authorization: Bearer $token" -s
$students = ConvertFrom-Json -InputObject $studentsRaw
$st = $students.items[0]
$stId = $st.id
$stName = $st.fullName
Write-Host "Student: $stName ($stId)"

# 1. Preview
$prevRaw = curl.exe "http://localhost:5000/api/finance/preview?studentId=$stId" -H "Authorization: Bearer $token" -s
$prev = ConvertFrom-Json -InputObject $prevRaw
Write-Host "Preview: BasePrice=$($prev.data.basePrice), Discount=$($prev.data.discountAmount), Final=$($prev.data.finalAmount), TeacherShare%=$($prev.data.teacherSharePercent), CenterShare=$($prev.data.estimatedCenterShare)"

# 2. Create Payment with 200,000 partial payment
$body = '{"studentId":"' + $stId + '","dueDate":"2026-09-30T00:00:00Z","initialPaidAmount":200000,"status":5,"description":"Sentyabr oyi (Qisman tolov)"}'
$payRaw = curl.exe -X POST http://localhost:5000/api/payments -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body -s
$pay = ConvertFrom-Json -InputObject $payRaw
$payId = $pay.data.id
Write-Host "Payment created: ID=$payId, Final=$($pay.data.finalAmount), Paid=$($pay.data.paidAmount), Debt=$($pay.data.debtAmount), Status=$($pay.data.status)"

# 3. Add Partial Payment of 150,000 with IdempotencyKey
$txBody = '{"paymentId":"' + $payId + '","amount":150000,"method":2,"idempotencyKey":"idemp-001","notes":"Payme orqali 2-bolib tolash"}'
$tx1Raw = curl.exe -X POST http://localhost:5000/api/finance/transactions -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $txBody -s
$tx1 = ConvertFrom-Json -InputObject $tx1Raw
Write-Host "Tx1 response: $($tx1.message)"

# 4. Duplicate transaction test (same IdempotencyKey)
$tx2Raw = curl.exe -X POST http://localhost:5000/api/finance/transactions -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $txBody -s
$tx2 = ConvertFrom-Json -InputObject $tx2Raw
Write-Host "Tx2 duplicate protection: $($tx2.message)"

# 5. Verify payment status after transactions
$updatedPayRaw = curl.exe "http://localhost:5000/api/payments/$payId" -H "Authorization: Bearer $token" -s
$updatedPay = ConvertFrom-Json -InputObject $updatedPayRaw
Write-Host "Updated Payment: Paid=$($updatedPay.data.paidAmount), Debt=$($updatedPay.data.debtAmount), Status=$($updatedPay.data.status)"
Write-Host "Teacher Share Amount: $($updatedPay.data.teacherShareAmount), Center Share: $($updatedPay.data.centerShareAmount)"

# 6. Center Expense
$expBody = '{"category":"Elektr energiya","amount":350000,"expenseDate":"2026-09-03T10:00:00Z","description":"Sentyabr oyi elektr tolovi"}'
$expRaw = curl.exe -X POST http://localhost:5000/api/finance/expenses -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $expBody -s
$exp = ConvertFrom-Json -InputObject $expRaw
Write-Host "Expense created: $($exp.data.category), Amount: $($exp.data.amount)"

# 7. Finance Summary
$sumRaw = curl.exe http://localhost:5000/api/finance/summary -H "Authorization: Bearer $token" -s
$sum = ConvertFrom-Json -InputObject $sumRaw
Write-Host "Summary: ExpectedRevenue=$($sum.data.totalExpectedRevenue), Collected=$($sum.data.totalCollectedRevenue), Debt=$($sum.data.totalDebtAmount), TeacherShares=$($sum.data.totalTeacherShares), CenterGross=$($sum.data.centerGrossMargin), Expenses=$($sum.data.totalCenterExpenses), NetProfit=$($sum.data.netProfit)"
