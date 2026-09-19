using System.Collections.Concurrent;
using System.Linq.Expressions;
using EduFlow.Application.Interfaces.Repositories;
using EduFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduFlow.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly EduFlowDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(EduFlowDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public IQueryable<T> Query() => _dbSet.AsQueryable();

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public virtual async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddRangeAsync(entities, cancellationToken);
    }

    public virtual Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public virtual async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(predicate, cancellationToken);
    }

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        return predicate == null 
            ? await _dbSet.CountAsync(cancellationToken) 
            : await _dbSet.CountAsync(predicate, cancellationToken);
    }
}

public class UnitOfWork : IUnitOfWork
{
    private readonly EduFlowDbContext _context;
    private readonly ConcurrentDictionary<Type, object> _repositories = new();

    public UnitOfWork(EduFlowDbContext context)
    {
        _context = context;
    }

    public IRepository<T> Repository<T>() where T : class
    {
        return (IRepository<T>)_repositories.GetOrAdd(typeof(T), _ => new Repository<T>(_context));
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}

public class StudentRepository : Repository<Student>, IStudentRepository
{
    public StudentRepository(EduFlowDbContext context) : base(context) { }

    public async Task<Student?> GetStudentWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.Parent)
            .Include(s => s.GroupStudents)
                .ThenInclude(gs => gs.Group)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }
}

public class TeacherRepository : Repository<Teacher>, ITeacherRepository
{
    public TeacherRepository(EduFlowDbContext context) : base(context) { }

    public async Task<Teacher?> GetTeacherWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(t => t.User)
            .Include(t => t.Groups)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }
}

public class GroupRepository : Repository<Group>, IGroupRepository
{
    public GroupRepository(EduFlowDbContext context) : base(context) { }

    public async Task<Group?> GetGroupWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(g => g.Teacher)
            .Include(g => g.Subject)
            .Include(g => g.GroupStudents)
                .ThenInclude(gs => gs.Student)
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }
}

public class LessonRepository : Repository<Lesson>, ILessonRepository
{
    public LessonRepository(EduFlowDbContext context) : base(context) { }

    public async Task<Lesson?> GetLessonWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(l => l.Group)
            .Include(l => l.Attendances)
                .ThenInclude(a => a.Student)
            .Include(l => l.Grades)
                .ThenInclude(g => g.Student)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Lesson>> GetTodayLessonsAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        return await _dbSet
            .Include(l => l.Group)
            .Include(l => l.Attendances)
            .Where(l => l.StartTime >= today && l.StartTime < tomorrow)
            .ToListAsync(cancellationToken);
    }
}

public class AttendanceRepository : Repository<Attendance>, IAttendanceRepository
{
    public AttendanceRepository(EduFlowDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Attendance>> GetLessonAttendancesAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Student)
            .Where(a => a.LessonId == lessonId)
            .ToListAsync(cancellationToken);
    }
}

public class GradeRepository : Repository<Grade>, IGradeRepository
{
    public GradeRepository(EduFlowDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Grade>> GetLessonGradesAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(g => g.Student)
            .Where(g => g.LessonId == lessonId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Grade>> GetStudentGradesAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(g => g.Lesson)
            .Where(g => g.StudentId == studentId)
            .ToListAsync(cancellationToken);
    }
}

public class PaymentRepository : Repository<Payment>, IPaymentRepository
{
    public PaymentRepository(EduFlowDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Payment>> GetOverduePaymentsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow.Date;
        return await _dbSet
            .Include(p => p.Student)
                .ThenInclude(s => s.Parent)
            .Where(p => (p.Status == EduFlow.Domain.Enums.PaymentStatus.Pending || p.Status == EduFlow.Domain.Enums.PaymentStatus.Overdue) && p.DueDate < now)
            .ToListAsync(cancellationToken);
    }
}

public class SubjectRepository : Repository<Subject>, ISubjectRepository
{
    public SubjectRepository(EduFlowDbContext context) : base(context) { }
}

public class OrganizationRepository : Repository<Organization>, IOrganizationRepository
{
    public OrganizationRepository(EduFlowDbContext context) : base(context) { }

    public async Task<Organization?> GetOrganizationWithSubscriptionAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(o => o.Subscriptions)
                .ThenInclude(s => s.SubscriptionPlan)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }
}
