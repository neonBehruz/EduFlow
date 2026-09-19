namespace EduFlow.Application.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"'{name}' ({key}) topilmadi.")
    {
    }

    public NotFoundException(string message) : base(message)
    {
    }
}

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException() : base("Bir yoki bir nechta tekshirish xatolari yuz berdi.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IDictionary<string, string[]> errors) : base("Bir yoki bir nechta tekshirish xatolari yuz berdi.")
    {
        Errors = errors;
    }

    public ValidationException(string message) : base(message)
    {
        Errors = new Dictionary<string, string[]> { { "General", new[] { message } } };
    }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "Ushbu amalni bajarish uchun sizda ruxsat yo'q.") : base(message)
    {
    }
}

public class PlanLimitExceededException : Exception
{
    public PlanLimitExceededException(string message) : base(message)
    {
    }
}

public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message)
    {
    }
}

