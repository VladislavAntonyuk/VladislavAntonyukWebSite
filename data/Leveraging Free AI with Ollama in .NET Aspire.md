Hello!

With the growing demand for AI integration in distributed applications, leveraging free AI models has become increasingly attractive. This article explores how to create an Ollama Provider for .NET Aspire and effectively integrate free AI into your distributed .NET applications.

### What is Ollama?

Ollama is an open-source platform that provides access to free AI models. It allows developers to integrate AI capabilities, such as natural language processing, without the burden of complex model training or high infrastructure costs. By creating an Ollama provider for .NET Aspire, you can enhance your application with AI-driven features while maintaining a low-cost and scalable solution.

### What is .NET Aspire?

.NET Aspire is a modern framework that simplifies the development of distributed applications, focusing on scalability, modularity, and performance. It provides seamless integration points for third-party providers, allowing developers to add custom functionalities like AI services into their distributed architecture.

### Setting Up Ollama in a .NET Aspire Application

In this section, we will walk through the process of setting up an Ollama Provider and integrating it into a .NET Aspire distributed application.

#### Step 1: Add Ollama to Your .NET Aspire Application

Ollama is available as a Docker container, you can add it to your .NET Aspire application using the `AddContainer`.

```csharp
var ollama = builder.AddContainer("ollama", "ollama/ollama");

var apiService = builder.AddProject<Projects.MauiAspireOllama_ApiService>("apiservice")
                        .WithReference(ollama);
```

But the code above doesn't work. You can't reference a resource created using `AddContainer`, because it doesn't know how to create a connection string in our "apiservice".

To fix the issue let's create an `OllamaResource` with the connection string.

#### Step 2: Create the Ollama Resource

In this step, we'll create a custom container resource for Ollama.

For that , we need to create a new class that inherits from `ContainerResource` and implements the `IResourceWithConnectionString` interface:

```csharp
public sealed class OllamaResource(string name) : ContainerResource(name), IResourceWithConnectionString
{
	private EndpointReference? httpReference;

	public EndpointReference HttpEndpoint =>
		httpReference ??= new(this, Name);

	public ReferenceExpression ConnectionStringExpression =>
		ReferenceExpression.Create(
			$"{HttpEndpoint.Property(EndpointProperty.Scheme)}://{HttpEndpoint.Property(EndpointProperty.Host)}:{HttpEndpoint.Property(EndpointProperty.Port)}/api"
		);
}
```

#### Step 3: Create Extension method to add Ollama in Your Application

This step is optional but recommended for better code organization. You can create an extension method to add Ollama to your .NET Aspire application:

```csharp
public static class OllamaResourceBuilderExtensions
{
	public static IResourceBuilder<OllamaResource> AddOllama(
		this IDistributedApplicationBuilder builder,
		string name,
		int? httpPort = null)
	{
		var resource = new OllamaResource(name);

		return builder.AddResource(resource)
		              .WithImage(OllamaContainerImageTags.Image)
		              .WithImageRegistry(OllamaContainerImageTags.Registry)
		              .WithImageTag(OllamaContainerImageTags.Tag)
		              .WithHttpEndpoint(
			              targetPort: 11434,
			              port: httpPort,
			              name: name)
		              .WithVolume("ollama", "/root/.ollama");
	}
}

internal static class OllamaContainerImageTags
{
	internal const string Registry = "docker.io";

	internal const string Image = "ollama/ollama";

	internal const string Tag = "0.3.8";
}
```

You can adjust the image tag and registry to match the version of Ollama you want to use. The latest tag can be found at https://hub.docker.com/r/ollama/ollama.

#### Step 4: Register the Ollama Resource in Your Application

Back to Program.cs and register the Ollama resource in your .NET Aspire application:
```csharp
var ollama = builder.AddOllama("ollama", 11434);

var apiService = builder.AddProject<Projects.MauiAspireOllama_ApiService>("apiservice")
                        .WithReference(ollama);
```

Now, as you can see, we can reference the Ollama resource in our "apiservice".

#### Step 5: Use Ollama in Your Application

Now that Ollama is set up in your .NET Aspire application, you can start using it in your distributed application's logic. For example, you can create an AI service that interacts with Ollama to generate responses based on user input.

To easily communicate with Ollama, let's install the `Ollama` package in your application:

```xml
<PackageReference Include="Ollama" Version="1.11.0" />
```

After installing the package, the next step is creating the `OllamaProvider` class:

```csharp
using Ollama;

public class OllamaProvider(IOllamaApiClient api)
{
	public async Task<string?> GetResponse(string model, string request)
	{
		var result = await api.Chat.GenerateChatCompletionAsync(new GenerateChatCompletionRequest()
		{
			Model = model,
			Messages = [
				new Message(MessageRole.User, request)
			],
			Format = ResponseFormat.Json
		});

		return result.Message.Content;
	}

	public async Task PullModelAsync(string model)
	{
		var runningModels = await api.Models.ListModelsAsync();
		if (runningModels.Models?.Select(x => x.Model1).Contains(model) == true)
		{
			return;
		}

		await api.Models.PullModelAsync(model);
	}
}
```

Now we need to register the Ollama API client in our application. Let's create an extension method to add the Ollama provider:

```csharp
public static class OllamaProviderExtensions
{
	public static IServiceCollection AddOllamaProvider(this IServiceCollection services, string baseUrl)
	{
		services.AddHttpClient<IOllamaApiClient, OllamaApiClient>(client => client.BaseAddress = new Uri(baseUrl))
				.AddStandardResilienceHandler(x =>
				{
					x.AttemptTimeout.Timeout = TimeSpan.FromMinutes(5);
					x.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(10);
					x.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(10);
				});
		services.AddSingleton<OllamaProvider>();
		return services;
	}
}
```

I set timeout to 5 minutes, because the response is not really fast, but you can change it to your needs.

Now we can register the Ollama provider in our application:

```csharp
builder.Services.AddOllamaProvider(builder.Configuration.GetConnectionString("ollama")!);
```

> Pay attention to the connection string. It should be the same as the one you set in the `OllamaResource` class.

Now you can use the `OllamaProvider` in your services or controllers to interact with Ollama and generate AI-driven responses.

```csharp
app.MapGet("/weatherforecast", async (OllamaProvider ollamaProvider) =>
{
	await ollamaProvider.PullModelAsync("llama3:latest");
	return await ollamaProvider.GetResponse(
		"llama3",
		"""
			Generate random weather for the next 5 days.
			Return the JSON Array with the next properties: (DateOnly Date, int TemperatureC, string? Summary). Example:
			{
				"forecast":[
					{
						"Date": "2024-09-27",
						"TemperatureC": 32,
						"Summary": "Hot"
					}
				]
			}
		""");
}
```

In this example, we pull the `llama3` model and generate a response based on the input provided. You can customize the model and request to fit your application's requirements. The list of available models can be found at https://ollama.com/library.

#### Step 4: Test the Integration

Once everything is set up, it's important to test the Ollama integration. Send requests to your application and observe how it responds using the free AI models from Ollama.

The first time you start it, Ollama will download the model, so it may take some time. After that, the response will be faster.

The AI should respond based on the input provided, showcasing the power of free AI within a distributed .NET Aspire application.

### Benefits of Using Ollama in .NET Aspire

1. **Cost-Effective AI Integration:** Ollama provides access to free AI models, making it a cost-effective solution for adding AI-driven functionality to your distributed applications.

1. **Scalable and Modular Architecture:** By leveraging .NET Aspire's modularity, you can easily scale the AI component in your application without significant overhead.

1. **Seamless Integration:** With the custom Ollama provider, you can integrate AI features into your application's existing logic with minimal effort.

### Conclusion

In this article, we explored how to leverage free AI with Ollama in a .NET Aspire distributed application. By setting up an Ollama provider and integrating it into your application's services, you can unlock the potential of AI without the high costs often associated with AI infrastructure.

This approach not only enhances your application's intelligence but also keeps it scalable and efficient. Whether for chatbots, recommendation engines, or any other AI-driven feature, Ollama combined with .NET Aspire offers a powerful solution for modern application development.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/AspireSamples/tree/main/MauiAspireOllama){target="_blank"}.

Happy coding!
