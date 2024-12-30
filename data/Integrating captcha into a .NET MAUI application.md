Hello and welcome to the most bot-resistant article in the world!

Today we are talking about captcha. Captcha is a security mechanism used to prevent automated programs or bots from accessing a website or application. It presents a challenge that is difficult for bots to solve but easy for humans to complete, thus ensuring that only human users can access the application.

Integrating a captcha in a `.NET MAUI` application is relatively easy and can be accomplished in a few simple steps. However there are multiple ways how it can be done, so in this article, we will look at two different approaches.

# .NET for Android

If your target platform is **Android**, you can use the `Google SafetyNet SDK` to integrate a captcha in your application.

## Register Google reCAPTCHA for your application

1. Open `Google reCAPTCHA` website: https://www.google.com/recaptcha/admin/create
2. Fill label and choose `reCAPTCHA v2` type, then `reCAPTCHA Android` subtype.

![Android reCAPTCHA setup](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/37/captcha-android-setup.png)

3. Copy the `Site key` and `Secret key` to the clipboard.

## Integrate Google reCAPTCHA in your application

The first step you need to do is add the `Google SafetyNet SDK` to your project.

Add the next code to your `csproj` file:

```xml
<ItemGroup>
	<PackageReference Include="Xamarin.GooglePlayServices.SafetyNet" Version="118.0.1.3" />
</ItemGroup>
```

The second step is to add a code to call the `Google reCAPTCHA` popup:

```csharp
private const string AndroidSiteKey = "YOUR-ANDROID-SITE-KEY-FROM-STEP-1";
private const string AndroidSecretKey = "YOUR-ANDROID-SECRET-KEY-FROM-STEP-1";

async void OnLoginClicked(object sender, EventArgs e)
{
	var api = Android.Gms.SafetyNet.SafetyNetClass.GetClient(Platform.CurrentActivity);
	var response = await api.VerifyWithRecaptchaAsync(AndroidSiteKey);
	if (response != null && !string.IsNullOrEmpty(response.TokenResult))
	{
		var captchaResponse = await ValidateCaptcha(response.TokenResult, AndroidSecretKey);
		if (captchaResponse is null || !captchaResponse.Success)
		{
			await Toast.Make($"Invalid captcha: {string.Join(",", captchaResponse?.ErrorCodes ?? Enumerable.Empty<object>())}", ToastDuration.Long).Show();
			return;
		}

		if (Platform.CurrentActivity!.PackageName != captchaResponse.ApkPackageName)
		{
			await Toast.Make($"Package Names do not match: {captchaResponse.ApkPackageName}", ToastDuration.Long).Show();
		}
		else
		{
			await Toast.Make("Success", ToastDuration.Long).Show();
		}
	}
	else
	{
		await Toast.Make("Failed", ToastDuration.Long).Show();
	}
}
```

![Android SafetyNet](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/37/Android.gif)

With this approach, you get an implementation provided by `Google` designed specifically for native applications.

It works with both `.NET MAUI` and `.NET MAUI Blazor` apps but only on **Android**.

# .NET MAUI solution

If you want to use the same solution for all platforms or want to use another captcha provider, you can use the `WebView`.

## Register a captcha for your website

There are several captcha providers available that you can use for your `.NET MAUI` application. Some of the most popular ones include `Google reCAPTCHA` and `hCaptcha`. Each provider has its own set of features, advantages, and disadvantages, so it's important to choose one that best suits your application's needs.

1. Open `Google reCAPTCHA` website: https://www.google.com/recaptcha/admin/create
2. Fill label and choose `reCAPTCHA v2` type, then `"I'm not a robot" Checkbox` subtype.

![.NET MAUI reCAPTCHA setup](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/37/captcha-blazor-setup.png)

3. Add "**0.0.0.0**" to the list of domains.
4. Copy the `Site key` and `Secret key` to the clipboard.

## Integrate a captcha in your application

If your application is `.NET MAUI Blazor`, you can add the next code to your `index.html`. If you use `.NET MAUI`, you need to upload the next code to your website (*most captcha providers do not allow to use of a captcha on localhost*).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</head>
<body>
    <div class="status-bar-safe-area"></div>
    <div class="g-recaptcha" data-sitekey="YOUR-WEBSITE-KEY-FROM-STEP-1" data-callback="validate"></div>
    <script src="_framework/blazor.webview.js" autostart="false"></script>
    <script>
        function validate(response) {
            window.location.href = './?token=' + response;
        }
    </script>
</body>

</html>
```

The next step is to add a `WebView` to your page and load the page with a captcha.

```xml
<BlazorWebView HostPage="wwwroot/index.html"
		UrlLoading="BlazorWebView_OnUrlLoading"/>
```

Here we subscribe to the `UrlLoading` event to get the captcha token.

The final step is to validate the captcha token.

```csharp
public class CaptchaResult
{
	[JsonPropertyName("success")]
	public bool Success { get; set; }

	[JsonPropertyName("challenge_ts")]
	public DateTime ChallengeTs { get; set; }

	[JsonPropertyName("apk_package_name")]
	public string? ApkPackageName { get; set; }

	[JsonPropertyName("error-codes")]
	public List<object>? ErrorCodes { get; set; }
}

private const string WebSiteKey = "YOUR-WEBSITE-KEY-FROM-STEP-1";
private const string WebSecretKey = "YOUR-WEBSITE-SECRET-KEY-FROM-STEP-1";

private async void BlazorWebView_OnUrlLoading(object? sender, UrlLoadingEventArgs e)
{
	e.UrlLoadingStrategy = UrlLoadingStrategy.OpenInWebView;
	var query = System.Web.HttpUtility.ParseQueryString(e.Url.Query);
	var token = query.Get("token");
	if (!string.IsNullOrEmpty(token))
	{
		var captchaResponse = await ValidateCaptcha(token, WebSecretKey);
		if (captchaResponse is null || !captchaResponse.Success)
		{
			await Toast.Make($"Invalid captcha: {string.Join(",", captchaResponse?.ErrorCodes ?? Enumerable.Empty<object>())}", ToastDuration.Long).Show();
			return;
		}

		await Toast.Make("Success", ToastDuration.Long).Show();
	}
}

static async Task<CaptchaResult?> ValidateCaptcha(string token, string secretKey)
{
	using var client = new HttpClient();
	var parameters = new Dictionary<string, string>
	{
		{ "secret", secretKey },
		{ "response", token }
	};
	var content = new FormUrlEncodedContent(parameters);
	var response = await client.PostAsync("https://www.google.com/recaptcha/api/siteverify", content);

	if (!response.IsSuccessStatusCode)
	{
		return null;
	}

	var responseContent = await response.Content.ReadFromJsonAsync<CaptchaResult>();
	return responseContent;
}
```

![Windows](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/37/Windows.gif)

# Conclusion

Integrating a captcha in a `.NET MAUI` application can help enhance security by preventing bots from accessing the application. By following the steps outlined above, you can easily add a captcha to your `.NET MAUI` application and provide an extra layer of security for your users.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiCaptcha){target="_blank"}.