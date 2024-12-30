Hello!

This is a continuation of the [first article](./articles/Onion-architecture-in-the-development-of-cross-platform-applications.-Part-1.-Overview){target="_blank"} about onion architecture in the development of cross-platform applications.

**Pragmatic Clean Architecture**

This comprehensive course will teach you the system I use to ship production-ready applications using Clean Architecture. Learn how to apply the best practices of modern software architecture. It contains Everything You Need To Build Production-Ready Applications With Clean Architecture.

[![Pragmatic Clean Architecture](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/misc/pca_cover_1.png)](https://www.courses.milanjovanovic.tech/a/aff_q2snzxhl/external?affcode=1486372_ffmooc4t)

**Domain and Application**

From the theory to the practice. For a closer look at onion architecture, let's create an application for ordering pizza. 

Create a solution called `PizzaStore`.

Create a new `Class Library` project type, and specify `PizzaStore.Domain` as its name.

Let's add a class representing the `Pizza` to the new project, which will represent the Domain Model:

```csharp
namespace PizzaStore.Domain;

public class Pizza
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public string? Image { get; set; }
	public decimal Price { get; set; }
}
```

Then add a new `Class Library` project, and name it `PizzaStore.Application`. Then reference project `PizzaStore.Domain` to the `PizzaStore.Application` and add a new interface as well:

```csharp
using PizzaStoreApp.Domain;

namespace PizzaStore.Application.Interfaces;

public interface IPizzaRepository
{
    Task<List<Pizza>> GetAll();
    Task<Pizza?> GetById(int id);
    Task<Pizza> Create(Pizza pizza);
    Task Update(Pizza pizza);
    Task Delete(int id);
}
```

This interface constitutes the Application layer and depends on the Domain Model layer.

When creating an application architecture, one must understand that the actual number of levels here is rather arbitrary. Depending on the scale of the tasks, there may be more or fewer levels. However, it is important to understand the very principle that we have the domain model at the center, and everything else depends on them. Each outer level can depend on the inner one, but not vice versa.

![Onion Architecture](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/10/onion-architecture2.png)

In the next article, we'll create Infrastructure level: [Onion architecture in the development of cross-platform applications. Part 3. Infrastructure](./articles/Onion-architecture-in-the-development-of-cross-platform-applications.-Part-3.-Infrastructure){target="_blank"}