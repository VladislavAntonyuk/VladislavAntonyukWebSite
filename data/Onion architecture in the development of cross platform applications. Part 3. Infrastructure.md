Hello!

This is a continuation of the [second article](./articles/Onion-architecture-in-the-development-of-cross-platform-applications.-Part-2.-Domain-and-Application){target="_blank"} about onion architecture in the development of cross-platform applications.

**Pragmatic Clean Architecture**

This comprehensive course will teach you the system I use to ship production-ready applications using Clean Architecture. Learn how to apply the best practices of modern software architecture. It contains Everything You Need To Build Production-Ready Applications With Clean Architecture.

[![Pragmatic Clean Architecture](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/misc/pca_cover_1.png)](https://www.courses.milanjovanovic.tech/a/aff_q2snzxhl/external?affcode=1486372_ffmooc4t)

**Infrastructure**

We continue creating `PizzaStore`.

In this article, we are moving to the outer layer, which will implement the data interfaces. 

Because we develop a cross-platform application we'll create `Infrastructure` projects for each application - Web and Mobile.

Let's start with the WebApp.

To do this, let's add the `Class Library` project and name it `PizzaStore.Infrastructure.WebApp.Data`.

This project will implement the `Application` layer interfaces. MS SQL Server will be used as storage, with which we will interact through the Entity Framework Core. 

The benefit of the separation is you can easily replace the Database, ORM Framework, e.g. MySQL and Dapper.

Therefore, we will add all the NuGet `Microsoft.EntityFrameworkCore` packages to this project. We will also add the `PizzaStore.Application` project reference to the project.

After that, add a new `WebAppContext` class to the project:
```csharp
namespace PizzaStore.Infrastructure.WebApp.Data.Repositories.Models;

using Microsoft.EntityFrameworkCore;

public class WebAppContext : DbContext
{
	public WebAppContext(DbContextOptions<WebAppContext> options)
		: base(options)
	{
	}

	public virtual DbSet<Pizza> Pizza => Set<Pizza>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.Entity<Pizza>(entity =>
		{
			entity.HasIndex(e => e.Name).IsUnique();
		});
	}
}
```

We also need to implement our `IPizzaRepository`:

```csharp
public class PizzaRepository : IPizzaRepository
{
	private readonly WebAppContext db;

	public PizzaRepository(WebAppContext db)
	{
		this.db = db;
	}

	public Task<List<Pizza>> GetAll()
	{
		return db.Pizza.ToListAsync();
	}

	public Task<Pizza?> GetById(int id)
	{
		return db.Pizza.SingleOrDefaultAsync(x => x.Id == id);
	}

	public async Task<Pizza> Create(Pizza pizza)
	{
		await db.Pizza.AddAsync(pizza);
		await db.SaveChangesAsync();
		return pizza;
	}

	public async Task Update(Pizza pizza)
	{
		db.Entry(pizza).State = EntityState.Modified;
		await db.SaveChangesAsync();
	}

	public async Task Delete(int id)
	{
		var pizza = await db.Pizza.SingleOrDefaultAsync(x => x.Id == id);
		if (pizza != null)
		{
			db.Pizza.Remove(pizza);
			await db.SaveChangesAsync();
		}
	}
}
```

The final step is registration the db connection:
```csharp
services.AddDbContext<StaffingContext>(opts => opts.UseSqlServer(configuration.GetConnectionString("MSSQLConnection")));
services.AddTransient<IPizzaRepository, PizzaRepository>();
```

For the Mobile application, the steps are the same. The difference is only in DB initialization:
```csharp
services.AddDbContext<StaffingContext>(opts => opts.UseSqlite(configuration.GetConnectionString("SqliteConnection")));
services.AddTransient<IPizzaRepository, PizzaRepository>();
```

In the next article, we'll create UI level: [Onion architecture in the development of cross-platform applications. Part 4. UI](./articles/Onion-architecture-in-the-development-of-cross-platform-applications.-Part-4.-UI){target="_blank"}