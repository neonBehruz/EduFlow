# EduFlow — Ma'lumotlar Modeli (ERD Diagramma)

Ushbu ERD diagrammasi EduFlow platformasining barcha asosiy jadvallari, ularning maydonlari va o‘zaro bog‘lanishlarini (Primary Key, Foreign Key) ko‘rsatadi.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has"
    ORGANIZATIONS ||--o{ SUBJECTS : "offers"
    ORGANIZATIONS ||--o{ TEACHERS : "employs"
    ORGANIZATIONS ||--o{ STUDENTS : "enrolls"
    ORGANIZATIONS ||--o{ GROUPS : "manages"

    USERS ||--o| TEACHERS : "account_of"
    USERS ||--o| STUDENTS : "account_of"
    USERS ||--o| PARENTS : "account_of"

    PARENTS ||--o{ STUDENTS : "parent_of"

    SUBJECTS ||--o{ GROUPS : "course_category"

    TEACHERS ||--o{ GROUPS : "leads"
    TEACHERS ||--o{ LESSONS : "teaches"
    TEACHERS ||--o{ HOMEWORKS : "assigns"

    GROUPS ||--o{ GROUP_STUDENTS : "enrollment"
    STUDENTS ||--o{ GROUP_STUDENTS : "enrolled_in"

    GROUPS ||--o{ LESSONS : "schedules"
    GROUPS ||--o{ HOMEWORKS : "tasks"

    LESSONS ||--o{ ATTENDANCES : "records"
    STUDENTS ||--o{ ATTENDANCES : "attended_by"

    LESSONS ||--o{ GRADES : "evaluates"
    STUDENTS ||--o{ GRADES : "graded"

    HOMEWORKS ||--o{ HOMEWORK_SUBMISSIONS : "submitted_for"
    STUDENTS ||--o{ HOMEWORK_SUBMISSIONS : "submits"

    STUDENTS ||--o{ PAYMENTS : "pays"
    GROUPS ||--o{ PAYMENTS : "for_group"
    PAYMENTS ||--o{ PAYMENT_TRANSACTIONS : "installments"

    USERS ||--o{ AUDIT_LOGS : "performs"

    USERS {
        uuid Id PK
        uuid OrganizationId FK
        string FirstName
        string LastName
        string Email
        string PasswordHash
        string PhoneNumber
        int Role
        boolean IsActive
        string RefreshToken
        datetime CreatedAt
    }

    SUBJECTS {
        uuid Id PK
        uuid OrganizationId FK
        string Name
        string Description
        decimal Price
        int DurationWeeks
        boolean IsActive
    }

    GROUPS {
        uuid Id PK
        uuid OrganizationId FK
        string Name
        uuid SubjectId FK
        uuid TeacherId FK
        uuid RoomId FK
        decimal MonthlyFee
        int MaxStudents
        boolean IsActive
    }

    GROUP_STUDENTS {
        uuid GroupId FK
        uuid StudentId FK
        datetime JoinedAt
        int Status
    }

    LESSONS {
        uuid Id PK
        uuid OrganizationId FK
        uuid GroupId FK
        uuid TeacherId FK
        uuid RoomId FK
        string Topic
        datetime StartTime
        datetime EndTime
        int Status
    }

    ATTENDANCES {
        uuid Id PK
        uuid OrganizationId FK
        uuid LessonId FK
        uuid StudentId FK
        int Status
        string Comment
        datetime CreatedAt
    }

    HOMEWORKS {
        uuid Id PK
        uuid OrganizationId FK
        uuid GroupId FK
        uuid TeacherId FK
        string Title
        string Description
        datetime DueDate
        int MaxScore
    }

    HOMEWORK_SUBMISSIONS {
        uuid Id PK
        uuid HomeworkId FK
        uuid StudentId FK
        string Content
        datetime SubmittedAt
        int Status
        decimal Score
        string Feedback
    }

    PAYMENTS {
        uuid Id PK
        uuid OrganizationId FK
        uuid StudentId FK
        uuid GroupId FK
        decimal BasePrice
        decimal DiscountAmount
        decimal FinalAmount
        decimal PaidAmount
        decimal DebtAmount
        int Status
        datetime DueDate
    }

    AUDIT_LOGS {
        uuid Id PK
        uuid UserId FK
        string Action
        string Entity
        string EntityId
        string Metadata
        datetime CreatedAt
    }
```
