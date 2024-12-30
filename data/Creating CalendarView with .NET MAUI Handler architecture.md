Merry Christmas!

May your holidays be filled with cheer, and your coding sessions be bug-free! In the spirit of giving and new beginnings, let’s unwrap the potential of the CalendarView in .NET MAUI's Handler architecture, a feature that reinforces just how versatile and user-friendly cross-platform development can be.

Before we get started, enjoy the .NET Conf 2023 - Ukraine.

[![YouTube Video Link](https://img.youtube.com/vi/sHVlg8Y6qlU/0.jpg)](https://www.youtube.com/watch?v=sHVlg8Y6qlU)

Curious about why .NET is the world's hottest software development platform?
 
This video from .NET Conf 2023 - Ukraine takes you on a journey through the power and potential of .NET Discover:
 
- The advantages of using .NET for your next project 
- How .NET MAUI helps build innovative applications 
- A glimpse into the exciting future of web development using Blazor 
- Microsoft Entra ID, AI, AR, and more
 
As a result of the conference, we built a World Explorer - AI Tour Guide. Explore the globe like never before with World Explorer. Our AI-powered app gives you in-depth insights about any place worldwide, provides a comprehensive description, and recommends local attractions with your personalized travel guide. Try it at https://world-explorer.azurewebsites.net
 
The materials for the conference can be found at https://github.com/VladislavAntonyuk/WorldExplorer

Back to the CalendarView.

## Introduction

Mostly all existing .NET MAUI CarouselView Nugets are based on a shared code, utilizing a variety of UI components such as Labels, Buttons, and more, all laid out using container views like Grid, StackLayout, or FlexLayout.

CalendarView is a classic example of a control where developers expect a rich feature set, seamless user interactions, and high performance across all platforms. In traditional Xamarin.Forms, developers often had to rely on custom renderers to bridge the gap between shared code and platform-specific customization for complex controls like calendars. However, with the advent of .NET MAUI and its Handler architecture, this process is much more streamlined and efficient.

## CalendarView

In .NET MAUI Handler architecture is a bridge between the interface and the platform control. This allows us to not depend on a specific implementation of .NET MAUI control and Platform control.
So, we need to create a new interface. 

> To make the article shorter and easier reading I will include only a few properties. The full sample can be found on GitHub.

```csharp
public interface ICalendarView : IView
{
	DayOfWeek FirstDayOfWeek { get; }
	DateTimeOffset MinDate { get; }
	DateTimeOffset MaxDate { get; }
	DateTimeOffset? SelectedDate { get; set; }
	void OnSelectedDateChanged(DateTimeOffset? selectedDate);
}
```

And now implement the interface:

```csharp
public class CalendarView : View, ICalendarView
{
	public static readonly BindableProperty FirstDayOfWeekProperty = BindableProperty.Create(nameof(FirstDayOfWeek), typeof(DayOfWeek), typeof(CalendarView), default(DayOfWeek));

	public DayOfWeek FirstDayOfWeek
	{
		get => (DayOfWeek)GetValue(FirstDayOfWeekProperty);
		set => SetValue(FirstDayOfWeekProperty, value);
	}

	...
}
```

Our control is ready, now we need to create a handler for each platform.

As there is a part of duplicated code in each handler let's extract it to a separate class. Create a `CalendarHandler` class:

```csharp
public partial class CalendarHandler
{
	public static IPropertyMapper<ICalendarView, CalendarHandler> PropertyMapper = new PropertyMapper<ICalendarView, CalendarHandler>(ViewMapper)
	{
		[nameof(ICalendarView.FirstDayOfWeek)] = MapFirstDayOfWeek,
		[nameof(ICalendarView.MinDate)] = MapMinDate,
		[nameof(ICalendarView.MaxDate)] = MapMaxDate,
		[nameof(ICalendarView.SelectedDate)] = MapSelectedDate
	};

	public static CommandMapper<ICalendarView, CalendarHandler> CommandMapper = new(ViewCommandMapper);

	public CalendarHandler(IPropertyMapper mapper, CommandMapper? commandMapper = null) : base(mapper, commandMapper)
	{
	}

	public CalendarHandler() : this(PropertyMapper, CommandMapper)
	{
	}
}
```

Now we are ready for creating a platform-specific code. For each platfrom we need to create a PlatfromView and implement `Map*` methods.

## iOS/MacCatalyst handler

Create a `CalendarHandler` class in `Platforms\iOS` and `Platforms\MacCatalyst` with the next content:

```csharp
public partial class CalendarHandler : ViewHandler<ICalendarView, UICalendarView>
{
	protected override UICalendarView CreatePlatformView()
	{
		return new UICalendarView();
	}

	private static void MapFirstDayOfWeek(CalendarHandler handler, ICalendarView virtualView)
	{
		handler.PlatformView.Calendar.FirstWeekDay = (nuint)virtualView.FirstDayOfWeek;
	}

	...
}
```

![.NET MAUI CalendarView MacCatalyst](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/49/maccatalyst.png)

## Windows handler

Create a `CalendarHandler` class in `Platforms\Windows` with the next content:

```csharp
using Calendar = Microsoft.UI.Xaml.Controls.CalendarView;

public partial class CalendarHandler : ViewHandler<ICalendarView, Calendar>
{
	protected override Calendar CreatePlatformView()
	{
		return new Calendar();
	}

	private static void MapFirstDayOfWeek(CalendarHandler handler, ICalendarView virtualView)
	{
		handler.PlatformView.FirstDayOfWeek = (DayOfWeek)virtualView.FirstDayOfWeek;
	}

	...
}
```

![.NET MAUI CalendarView Windows](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/49/windows.png)

## Android handler

Android implementation uses old good `Android.Widget.CalendarView`. It is not a material design control. It also lacks features like selecting a range of dates. In the next article, I will show you how to easily use the Java library in .NET MAUI Android. But for now, create a `CalendarHandler` class in `Platforms\Android` with the next content:

```csharp
using Calendar = Android.Widget.CalendarView;

public partial class CalendarHandler : ViewHandler<ICalendarView, Calendar>
{
	protected override Calendar CreatePlatformView()
	{
		return new Calendar(Context);
	}

	private static void MapFirstDayOfWeek(CalendarHandler handler, ICalendarView virtualView)
	{
		handler.PlatformView.FirstDayOfWeek = (int)virtualView.FirstDayOfWeek;
	}

	...
}
```

![.NET MAUI CalendarView Android](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/49/android.png)

## Final step

The final step is registering our handlers using `ConfigureMauiHandlers` method:

```csharp
public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder.UseMauiApp<App>();
		builder.ConfigureMauiHandlers(handlers =>
		{
			handlers.AddHandler<CalendarView, CalendarViewHandler>();
		});

		return builder.Build();
	}
}
```

That's all we need to create a .NET MAUI CalendarView.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiBells){target="_blank"}.

Happy holidays!
