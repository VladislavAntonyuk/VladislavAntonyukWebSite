There was a time when Windows automatically changed brightness depending on power status. For example, when my laptop is plugged in the brightness is 100%, and when it's on battery the brightness is 70%.

It worked well till Windows 10 1903 update. After that, the brightness remained the same after unplugging the cable. The question was asked on Microsoft website ([Link](https://answers.microsoft.com/en-us/windows/forum/all/unable-to-set-brightness-level-for-plugged-in-and/f4dbbd4f-b325-471f-912b-7f9785161729){target="_blank"}), but it is still open.

Let's now fix it using the latest .NET!

First of all, create a WorkerService.
```
dotnet new worker
```

Now we need to convert it to WindowsService.

1. First add NuGet package `Microsoft.Extensions.Hosting.WindowsServices`

2. Then in `Program.cs` call `UseWindowsService()` in `CreateHostBuilder`:
```csharp
public static IHostBuilder CreateHostBuilder(string[] args)
{
	return Host.CreateDefaultBuilder(args)
		.ConfigureServices((_, services) => { services.AddHostedService<Worker>(); })
		.UseWindowsService();
}
```

Our base Windows Service is ready.

Now let's back to our main issue.

This utility is split into 2 parts: the first checks the power status, and the second sets the brightness.
#### Part 1. Check the Power status ####
```csharp
public enum BatteryFlag : byte
{
	High = 1,
	Low = 2,
	Critical = 4,
	Charging = 8,
	NoSystemBattery = 128,
	Unknown = 255
}

public enum AcLineStatus: byte
{
	Offline = 0,
	Online = 1,
	Unknown = 255
}

[StructLayout(LayoutKind.Sequential)]
public class PowerState
{
	public AcLineStatus ACLineStatus;
	public BatteryFlag BatteryFlag;

	// direct instantiation not intended, use GetPowerState.
	private PowerState()
	{
	}

	public static PowerState GetPowerState()
	{
		var state = new PowerState();
		if (GetSystemPowerStatusRef(state))
			return state;

		throw new ApplicationException("Unable to get power state");
	}

	[DllImport("Kernel32", EntryPoint = "GetSystemPowerStatus")]
	private static extern bool GetSystemPowerStatusRef(PowerState sps);
}
```
Let's now see what is here.
1. `BatteryFlag` describes the current battery status. It has the value `NoSystemBattery` which we use to know if the device is a desktop or a laptop.
2. `AcLineStatus` describes if a device is charging (`Online`) or not (`Offline`).
3. `GetPowerState` method calls the WinApi method to get the current power state.

#### Part 2. Creating the Brightness Service ####
```csharp
internal class BrightnessService
{
	public static byte GetBrightness()
	{
		var managementObjectSearcher = new ManagementObjectSearcher(new ManagementScope("root\\WMI"),
			new SelectQuery("WmiMonitorBrightness"));
		var objectCollection = managementObjectSearcher.Get();
		byte num = 0;
		using (var enumerator = objectCollection.GetEnumerator())
		{
			if (enumerator.MoveNext())
				num = (byte) enumerator.Current.GetPropertyValue("CurrentBrightness");
		}

		objectCollection.Dispose();
		managementObjectSearcher.Dispose();
		return num;
	}		

	public static void SetBrightness(byte targetBrightness)
	{
		var managementObjectSearcher = new ManagementObjectSearcher(new ManagementScope("root\\WMI"),
			new SelectQuery("WmiMonitorBrightnessMethods"));
		var objectCollection = managementObjectSearcher.Get();
		using (var enumerator = objectCollection.GetEnumerator())
		{
			if (enumerator.MoveNext())
				((ManagementObject) enumerator.Current).InvokeMethod("WmiSetBrightness", new object[]
				{
					uint.MaxValue,
					targetBrightness
				});
		}

		objectCollection.Dispose();
		managementObjectSearcher.Dispose();
	}
}
```
Using WMI we get and set the brightness.

The last part is left. We need to call our services. Open `Worker.cs` and replace `ExecuteAsync` method content with:
```csharp
const byte minBrightness = 0;
const byte maxBrightness = 100;
while (!stoppingToken.IsCancellationRequested)
{
	var powerState = PowerState.GetPowerState();
	if (powerState.BatteryFlag == BatteryFlag.NoSystemBattery)
	{
		await StopAsync(stoppingToken);
	}
	else
	{
		var currentBrightness = BrightnessService.BrightnessService.GetBrightness();
		var desiredBrightness = powerState.ACLineStatus == AcLineStatus.Offline
			? minBrightness
			: maxBrightness;
		if (currentBrightness != desiredBrightness)
		{
			BrightnessService.BrightnessService.SetBrightness(desiredBrightness);
		}
	}

	await Task.Delay(1000, stoppingToken);
}
```
So we check for the power state. If our device is a desktop (`NoSystemBattery`) just stop the service. Else get the current brightness and compare it to the desired. If they are different we call the `BrightnessService`. To monitor the status and react to the power state changes we wait for 1 second and then try to set the brightness again.

## Bonus ##
Create install/uninstall scripts.

 ### Install script ###
```
SC CREATE "ScreenBrightnessService" start= auto binpath= "%~d0%~p0\ScreenBrightnessService.exe"
SC START "ScreenBrightnessService"
```
Save and copy the bat file to the output directory and run as administrator. The WindowsService should appear in the list of services

![Screen Brightness Service](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/3/screen-brightness-service.png)

 ### Uninstall script ###
```
SC STOP "ScreenBrightnessService"
SC DELETE "ScreenBrightnessService"
```
Save and copy the bat file to the output directory and run as administrator. The WindowsService should disappear from the list of services

## P.S. ##
After some days of usage, I found the flickering of the screen. It happens because Windows has another place where it stores the current brightness settings. Let's now fix the issue.

Add new method to the `BrightnessService`:
```csharp
private static void SetBrightnessRegistry(byte targetBrightness)
{
	try
	{
		var key = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\Power\User\PowerSchemes");
		var activePowerScheme = key.GetValue("ActivePowerScheme");
		key = key.OpenSubKey($@"{activePowerScheme}\7516b95f-f776-4464-8c53-06167f40cc99\aded5e82-b909-4619-9949-f5d71dac0bcb", true);
		key.SetValue("ACSettingIndex", targetBrightness, RegistryValueKind.DWord);
		key.SetValue("DCSettingIndex", targetBrightness, RegistryValueKind.DWord);
	}
	catch (Exception e)
	{
		// do some logging here
		throw;
	}
}
```
Now call this method in `SetBrigthness`.
That's it.

You can download the solution on my GitHub: [WindowsService](https://github.com/VladislavAntonyuk/WindowsService "WindowsService"){target="_blank"}
