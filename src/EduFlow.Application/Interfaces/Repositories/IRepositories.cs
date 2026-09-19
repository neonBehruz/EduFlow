using System.Linq.Expressions;
using EduFlow.Domain.Entities;

namespace EduFlow.Application.Interfaces.Repositories;

public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);
}

public interface IUnitOfWork : IDisposable
{
    IRepository<T> Repository<T>() where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IStudentRepository : IRepository<Student>
{
    Task<Student?> GetStudentWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface ITeacherRepository : IRepository<Teacher>
{
    Task<Teacher?> GetTeacherWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IGroupRepository : IRepository<Group>
{
    Task<Group?> GetGroupWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface ILessonRepository : IRepository<Lesson>
{
    Task<Lesson?> GetLessonWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Lesson>> GetTodayLessonsAsync(CancellationToken cancellationToken = default);
}

public interface IAttendanceRepository : IRepository<Attendance>
{
    Task<IReadOnlyList<Attendance>> GetLessonAttendancesAsync(Guid lessonId, CancellationToken cancellationToken = default);
}

public interface IGradeRepository : IRepository<Grade>
{
    Task<IReadOnlyList<Grade>> GetLessonGradesAsync(Guid lessonId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Grade>> GetStudentGradesAsync(Guid studentId, CancellationToken cancellationToken = default);
}

public interface IPaymentRepository : IRepository<Payment>
{
    Task<IReadOnlyList<Payment>> GetOverduePaymentsAsync(CancellationToken cancellationToken = default);
}

public interface ISubjectRepository : IRepository<Subject>
{
}

public interface IOrganizationRepository : IRepository<Organization>
{
    Task<Organization?> GetOrganizationWithSubscriptionAsync(Guid id, CancellationToken cancellationToken = default);
}
