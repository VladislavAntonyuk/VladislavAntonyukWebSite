Hello!

This is a continuation of the [third article](./articles/Onion-architecture-in-the-development-of-cross-platform-applications.-Part-3.-Infrastructure){target="_blank"} about onion architecture in the development of cross-platform applications.

**Pragmatic Clean Architecture**

This comprehensive course will teach you the system I use to ship production-ready applications using Clean Architecture. Learn how to apply the best practices of modern software architecture. It contains Everything You Need To Build Production-Ready Applications With Clean Architecture.

[![Pragmatic Clean Architecture](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/misc/pca_cover_1.png)](https://www.courses.milanjovanovic.tech/a/aff_q2snzxhl/external?affcode=1486372_ffmooc4t)

**UI**

We continue creating `PizzaStore`.

In this article, we are moving to the final stage - developing user interface for our store. 

Because we develop a cross-platform application we'll create `UI` projects for each application - `Web` and `Mobile`.

## WebApp

1. Create a new `Blazor` website.
2. Reference all other projects:
```xml
<ItemGroup>
    <ProjectReference Include="..\..\..\Application\PizzaStore.Application\PizzaStore.Application.csproj" />
    <ProjectReference Include="..\..\..\Infrastructure\WebApp\PizzaStore.Infrastructure.WebApp.Business\PizzaStore.Infrastructure.WebApp.Business.csproj" />
    <ProjectReference Include="..\..\..\Infrastructure\WebApp\PizzaStore.Infrastructure.WebApp.Data\PizzaStore.Infrastructure.WebApp.Data.csproj" />
</ItemGroup>
```

3. Update `Program.cs` to init all our layers:
```csharp
builder.Services.AddApplication();
builder.Services.AddInfrastructureData("server=localhost;port=3306;database=App1;user=root;password=password");
builder.Services.AddInfrastructureBusiness();
```

4. Let's create a table with all our records. I am using [`MudBlazor`](https://mudblazor.com){target="_blank"}.
```html
@page "/"
@using PizzaStore.Application.UseCases.Pizza
@inherits PizzaStoreBaseComponent

<Head Title="Pizza" />

<MudText Typo="Typo.h1">Pizza</MudText>

<MudText Typo="Typo.body1">This component demonstrates fetching data from a service.</MudText>

<MudButton OnClick="@CreatePizza" Color="Color.Primary">Create item</MudButton>

<MudTable @ref="table" ServerData="@(new Func<TableState, Task<TableData<PizzaDto>>>(LoadPizzas))" Virtualize="true" FixedHeader="true">
    <ToolBarContent>
        <MudText Typo="Typo.h6">Pizza</MudText>
    </ToolBarContent>
    <HeaderContent>
        <MudTh>Id</MudTh>
        <MudTh>Name</MudTh>
        <MudTh></MudTh>
    </HeaderContent>
    <RowTemplate>
        <MudTd DataLabel="Id">@context.Id</MudTd>
        <MudTd DataLabel="Name">@context.Name</MudTd>
        <MudTd DataLabel="">
            <MudButton Color="Color.Primary" Command="updateCommand" CommandParameter="@context.Id">Update</MudButton>
            <MudButton Color="Color.Primary" Command="deleteCommand" CommandParameter="@context.Id">Delete</MudButton>
        </MudTd>
    </RowTemplate>
    <NoRecordsContent>
        <MudText>No matching records found</MudText>
    </NoRecordsContent>
    <LoadingContent>
        <MudText>Loading...</MudText>
    </LoadingContent>
    <PagerContent>
        <MudTablePager />
    </PagerContent>
</MudTable>
```

5. Update code behind:
```csharp

public partial class Index : ComponentBase
{
	private readonly ICommand deleteCommand;
	private readonly ICommand updateCommand;
	private MudTextField<string>? searchString;

	private MudTable<PizzaDto> table = null!;

	public Index()
	{
		updateCommand = new ModelCommand<int>(async id => await Update(id));
		deleteCommand = new ModelCommand<int>(async id => await Delete(id));
	}

	[Inject]
	public required IQueryDispatcher QueryDispatcher { get; set; }

	[Inject]
	public required ICommandDispatcher CommandDispatcher { get; set; }
    
    [Inject]
	public required ISnackbar Snackbar { get; set; }

	private async Task<TableData<PizzaDto>> LoadPizzas(TableState state)
	{
		var result = await QueryDispatcher.SendAsync<GetPizzaByFilterResponse, GetPizzaQuery>(new GetPizzaQuery
		{
			Limit = state.PageSize,
			Name = searchString?.Value,
			Offset = state.Page
		}, CancellationToken.None);
		if (result.IsSuccessful)
		{
			return new TableData<PizzaDto>
			{
				TotalItems = result.Value.TotalCount,
				Items = result.Value.Items
			};
		}

		return new TableData<PizzaDto>();
	}

	private async Task CreatePizza()
	{
		var result = await CommandDispatcher.SendAsync<PizzaDto, CreatePizzaCommand>(new CreatePizzaCommand
		{
			Name = DateTime.Now.ToString("O")
		}, CancellationToken.None);
		if (result.IsSuccessful)
		{
			Snackbar.Add("Created", Severity.Success);
			await table.ReloadServerData();
		}
		else
		{
			Snackbar.Add(result.Errors.FirstOrDefault("Error has occurred"), Severity.Error);
		}
	}

	private async Task Delete(int id)
	{
		var result = await CommandDispatcher.SendAsync<bool, DeletePizzaCommand>(new DeletePizzaCommand(id), CancellationToken.None);
		if (result.IsSuccessful)
		{
			Snackbar.Add("Deleted", Severity.Success);
			await table.ReloadServerData();
		}
		else
		{
			Snackbar.Add(result.Errors.FirstOrDefault("Error has occurred"), Severity.Error);
		}
	}

	private async Task Update(int id)
	{
		var result = await CommandDispatcher.SendAsync<PizzaDto, UpdatePizzaCommand>(new UpdatePizzaCommand(id)
		{
			Name = DateTime.Now.ToString("O")
		}, CancellationToken.None);
		if (result.IsSuccessful)
		{
			Snackbar.Add("Updated", Severity.Success);
			await table.ReloadServerData();
		}
		else
		{
			Snackbar.Add(result.Errors.FirstOrDefault("Error has occurred"), Severity.Error);
		}
	}
}
```

## Mobile

1. Create a new `.NET MAUI` app.
2. Reference all other projects:
```xml
<ItemGroup>
    <ProjectReference Include="..\..\..\Application\PizzaStore.Application\PizzaStore.Application.csproj" />
    <ProjectReference Include="..\..\..\Infrastructure\Mobile\PizzaStore.Infrastructure.Mobile.Business\PizzaStore.Infrastructure.Mobile.Business.csproj" />
    <ProjectReference Include="..\..\..\Infrastructure\Mobile\PizzaStore.Infrastructure.Mobile.Data\PizzaStore.Infrastructure.Mobile.Data.csproj" />
</ItemGroup>
```
3. Update `MauiProgram.cs` to init all our layers:
```csharp
public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder.UseMauiApp<App>();
		builder.Services.AddApplication();
		builder.Services.AddInfrastructureData(GetDatabaseConnectionString("PizzaStore"));
		builder.Services.AddInfrastructureBusiness();
		var app = builder.Build();
		MigrateDb(app.Services);
		return app;
	}

	private static string GetDatabaseConnectionString(string filename)
	{
		return $"Filename={Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), filename)}.db";
	}

	private static void MigrateDb(IServiceProvider serviceProvider)
	{
		using var scope = serviceProvider.CreateScope();
		var factory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<MobileAppContext>>();
		using var context = factory.CreateDbContext();
		context.Database.Migrate();
	}
}
```
4. Update `MainPage.xaml`:
```xml
<CollectionView ItemsSource="{Binding Items}"
                x:Name="PizzasCollectionView"
                EmptyView="No items"
                Margin="10">
    <CollectionView.ItemsLayout>
        <LinearItemsLayout Orientation="Vertical" ItemSpacing="10" />
    </CollectionView.ItemsLayout>
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <Grid RowDefinitions="60, *, 30, 30" ColumnDefinitions="*, 60">
                <Image Grid.RowSpan="4" Grid.ColumnSpan="2" Aspect="Center" Source="{Binding Image}"/>
                <Button  Grid.Row="0" Grid.Column="1" Text="Like"/>
                <Label Grid.Row="2" Grid.Column="0" Text="{Binding Name}"/>
                <Label Grid.Row="3" Grid.Column="0" Text="{Binding Price}" VerticalOptions="End"/>
                <Button Grid.Row="2" Grid.RowSpan="2" Grid.Column="1" Text="Buy"
                        Command="{Binding Source={RelativeSource AncestorType={x:Type viewModels:MainViewModel}}, Path=BuyCommand}"
                        CommandParameter="{Binding Id}"/>
            </Grid>
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```
5. Update `MainViewModel.cs` that is a `BindingContext` of our page:
```csharp
public partial class MainViewModel : ObservableObject
{
	private readonly IQueryDispatcher queryDispatcher;
	private readonly ICommandDispatcher commandDispatcher;

	[ObservableProperty]
	private ObservableCollection<PizzaDto> items = new();

	public MainViewModel(IQueryDispatcher queryDispatcher, ICommandDispatcher commandDispatcher)
	{
		this.queryDispatcher = queryDispatcher;
		this.commandDispatcher = commandDispatcher;
		GetItemsCommand.Execute(null);
	}

	[RelayCommand]
	async Task GetItems(CancellationToken cancellationToken)
	{
		var result = await queryDispatcher.SendAsync<GetPizzaByFilterResponse, GetPizzaQuery>(new GetPizzaQuery
		{
			Limit = 25
		}, cancellationToken);
		if (result.IsSuccessful)
		{
			items.Clear();
			foreach (var item in result.Value.Items)
			{
				items.Add(item);
			}
		}
		else
		{
			var errors = string.Join(Environment.NewLine, result.Errors);
			await Toast.Make(errors, ToastDuration.Long).Show(cancellationToken);
		}
	}

	[RelayCommand]
	async Task Buy(int itemId, CancellationToken cancellationToken)
	{
		var result = await commandDispatcher.SendAsync<PizzaDto, UpdatePizzaCommand>(new UpdatePizzaCommand(itemId)
		{
			Name = DateTime.Now.ToString("O")
		}, cancellationToken);
		if (result.IsSuccessful)
		{
			await GetItems(cancellationToken);
		}
		else
		{
			var errors = string.Join(Environment.NewLine, result.Errors);
			await Toast.Make(errors, ToastDuration.Long).Show(cancellationToken);
		}
	}
}
```

## Conclusion

This is a final article in these series. Now you know how to create application with onion architecture.

To simplify all these steps, I created a template, that you can use to create cross-platform application with onion architecture. It is available as a `NuGet` package: [.NET Templates](https://www.nuget.org/packages/VladislavAntonyuk.DotNetTemplates){target="_blank"}.

Once again, I highly recommend [this course](https://www.courses.milanjovanovic.tech/a/aff_q2snzxhl/external?affcode=1486372_ffmooc4t) for a Clean Architecture Deep-Dive.

Happy coding!