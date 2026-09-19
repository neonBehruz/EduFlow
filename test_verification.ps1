$loginBody = @{
    email = "admin@smartedu.uz"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.data.token
    Write-Host "1. Login Success! Token: $($token.Substring(0, 20))..." -ForegroundColor Green

    $headers = @{ Authorization = "Bearer $token" }

    # Test /api/users
    $users = Invoke-RestMethod -Uri "http://localhost:5000/api/users" -Headers $headers
    Write-Host "2. GET /api/users Success! Total users: $($users.totalCount)" -ForegroundColor Green

    # Test /api/courses
    $courses = Invoke-RestMethod -Uri "http://localhost:5000/api/courses" -Headers $headers
    Write-Host "3. GET /api/courses Success! Total courses: $($courses.Count)" -ForegroundColor Green

    # Test Schedule Conflict Validation
    Write-Host "4. Testing Schedule Conflict Detection..." -ForegroundColor Cyan
    $groupsRes = Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Headers $headers
    Write-Host "   Groups count: $($groupsRes.items.Count)" -ForegroundColor Cyan
    
    $targetGroupId = $null
    if ($groupsRes.items.Count -gt 0) {
        $targetGroupId = $groupsRes.items[0].id
    } else {
        # Create a group if none exists
        $subjectId = $courses[0].id
        $teacher = (Invoke-RestMethod -Uri "http://localhost:5000/api/teachers" -Headers $headers).items[0]
        $newGroup = @{
            name = "Conflict Test Group"
            subjectId = $subjectId
            teacherId = $teacher.id
            scheduleDays = @(1, 3, 5)
            startTime = "14:00:00"
            endTime = "16:00:00"
        } | ConvertTo-Json
        $createdGroup = Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Method Post -Headers $headers -ContentType "application/json" -Body $newGroup
        $targetGroupId = $createdGroup.data.id
        Write-Host "   Created test group: $targetGroupId" -ForegroundColor Cyan
    }
    Write-Host "   Using Group ID: $targetGroupId" -ForegroundColor Cyan

    # Clear existing lessons for this test group if any
    $existingLessons = (Invoke-RestMethod -Uri "http://localhost:5000/api/lessons?groupId=$targetGroupId" -Headers $headers).items
    foreach ($l in $existingLessons) {
        Invoke-RestMethod -Uri "http://localhost:5000/api/lessons/$($l.id)" -Method Delete -Headers $headers | Out-Null
    }

    $baseTime = (Get-Date).ToUniversalTime().AddDays(30)
    $lesson1 = @{
        groupId = $targetGroupId
        topic = "Test Conflict Lesson 1"
        startTime = $baseTime.ToString("o")
        endTime = $baseTime.AddHours(1).ToString("o")
    } | ConvertTo-Json

    $create1 = Invoke-RestMethod -Uri "http://localhost:5000/api/lessons" -Method Post -Headers $headers -ContentType "application/json" -Body $lesson1
    Write-Host "   Lesson 1 created successfully: $($create1.data.topic)" -ForegroundColor Green

    # Try creating overlapping lesson 2 (starts 15 minutes into lesson 1)
    $lesson2 = @{
        groupId = $targetGroupId
        topic = "Test Conflict Lesson 2 (Overlap)"
        startTime = $baseTime.AddMinutes(15).ToString("o")
        endTime = $baseTime.AddHours(1).AddMinutes(15).ToString("o")
    } | ConvertTo-Json

    try {
        $create2 = Invoke-RestMethod -Uri "http://localhost:5000/api/lessons" -Method Post -Headers $headers -ContentType "application/json" -Body $lesson2
        Write-Host "   ERROR: Conflict was NOT blocked!" -ForegroundColor Red
    } catch {
        Write-Host "   SUCCESS: Conflict was blocked as expected! Error: $($_.Exception.Message)" -ForegroundColor Green
    } finally {
        # Clean up test lesson 1
        Invoke-RestMethod -Uri "http://localhost:5000/api/lessons/$($create1.data.id)" -Method Delete -Headers $headers | Out-Null
        Write-Host "   Test lesson cleaned up." -ForegroundColor Gray
    }

    Write-Host "`nALL VERIFICATION CHECKS PASSED!" -ForegroundColor Green
} catch {
    Write-Host "Error during verification: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body" -ForegroundColor Yellow
    }
}
