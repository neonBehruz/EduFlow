namespace EduFlow.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

public interface ITenantEntity
{
    public Guid OrganizationId { get; set; }
}

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
