Hello!

If you feel alone and are looking for someone for a coffee talk, maybe that someone is in front of you. Yes, it is your device. ;-) Imagine, that you ask your device a question and it replies to you. This article is devoted to a built-in speech recognition mechanism.

`.NET MAUI` already has a mechanism to convert text to speech. There is a method `SpeakAsync`, that receives a text you want to hear:

```csharp
await TextToSpeech.Default.SpeakAsync("Hello world!");
```

Let's create a similar API, but for `Speech-To-Text`.

Starting from the interface:

```csharp
public interface ISpeechToText
{
	Task<string> Listen(CultureInfo culture, IProgress<string>? recognitionResult, CancellationToken cancellationToken);
}
```
where `culture` is our spoken language, `recognitionResult` is an intermediate response from the `Recognizer`, `cancallationToken` is used for stopping the process. The result of the method returns the final string output from the `Recognizer`.

## Android

Speech recognizer requires access to a microphone and the Internet, so add these lines to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

Now let's implement our `ISpeechToText` interface:

```csharp
public sealed class SpeechToTextImplementation : ISpeechToText
{
	private SpeechRecognitionListener? listener;
	private SpeechRecognizer? speechRecognizer;

	public async Task<string> Listen(CultureInfo culture, IProgress<string>? recognitionResult, CancellationToken cancellationToken)
	{
		var taskResult = new TaskCompletionSource<string>();
		listener = new SpeechRecognitionListener
		{
			Error = ex => taskResult.TrySetException(new Exception("Failure in speech engine - " + ex)),
			PartialResults = sentence =>
			{
				recognitionResult?.Report(sentence);
			},
			Results = sentence => taskResult.TrySetResult(sentence)
		};
		speechRecognizer = SpeechRecognizer.CreateSpeechRecognizer(Android.App.Application.Context);
		if (speechRecognizer is null)
		{
			throw new ArgumentException("Speech recognizer is not available");
		}

		speechRecognizer.SetRecognitionListener(listener);
		speechRecognizer.StartListening(CreateSpeechIntent(culture));
		await using (cancellationToken.Register(() =>
		             {
			             StopRecording();
			             taskResult.TrySetCanceled();
		             }))
		{
			return await taskResult.Task;
		}
	}

	private void StopRecording()
	{
		speechRecognizer?.StopListening();
		speechRecognizer?.Destroy();
	}

	private Intent CreateSpeechIntent(CultureInfo culture)
	{
		var intent = new Intent(RecognizerIntent.ActionRecognizeSpeech);
		intent.PutExtra(RecognizerIntent.ExtraLanguagePreference, Java.Util.Locale.Default);
		var javaLocale = Java.Util.Locale.ForLanguageTag(culture.Name);
		intent.PutExtra(RecognizerIntent.ExtraLanguage, javaLocale);
		intent.PutExtra(RecognizerIntent.ExtraLanguageModel, RecognizerIntent.LanguageModelFreeForm);
		intent.PutExtra(RecognizerIntent.ExtraCallingPackage, Android.App.Application.Context.PackageName);
		intent.PutExtra(RecognizerIntent.ExtraPartialResults, true);

		return intent;
	}
}

public class SpeechRecognitionListener : Java.Lang.Object, IRecognitionListener
{
	public Action<SpeechRecognizerError>? Error { get; set; }
	public Action<string>? PartialResults { get; set; }
	public Action<string>? Results { get; set; }
	public void OnBeginningOfSpeech()
	{

	}

	public void OnBufferReceived(byte[]? buffer)
	{
	}

	public void OnEndOfSpeech()
	{
	}

	public void OnError([GeneratedEnum] SpeechRecognizerError error)
	{
		Error?.Invoke(error);
	}

	public void OnEvent(int eventType, Bundle? @params)
	{
	}

	public void OnPartialResults(Bundle? partialResults)
	{
		SendResults(partialResults, PartialResults);
	}

	public void OnReadyForSpeech(Bundle? @params)
	{
	}

	public void OnResults(Bundle? results)
	{
		SendResults(results, Results);
	}

	public void OnRmsChanged(float rmsdB)
	{
	}

	void SendResults(Bundle? bundle, Action<string>? action)
	{
		var matches = bundle?.GetStringArrayList(SpeechRecognizer.ResultsRecognition);
		if (matches == null || matches.Count == 0)
		{
			return;
		}

		action?.Invoke(matches.First());
	}
}
```

The main 2 lines here are:

```csharp
speechRecognizer.SetRecognitionListener(listener);
speechRecognizer.StartListening(CreateSpeechIntent(culture));
```

The first line set the `SpeechRecognitionListener` that has a list of methods for different states of your speech recognition.

The second line creates speech intent, which has a configuration for speech recognizer and then starts the listening.

## iOS/MacCatalyst

Speech recognizer requires access to a microphone, so add these lines to `Info.plist`:

```xml
<key>NSSpeechRecognitionUsageDescription</key>  
<string>Recognize</string>  
<key>NSMicrophoneUsageDescription</key>  
<string>Microphone usage</string>
```

Now let's implement our `ISpeechToText` interface:

```csharp
public sealed class SpeechToTextImplementation : ISpeechToText
{
	private AVAudioEngine? audioEngine;
	private SFSpeechAudioBufferRecognitionRequest? liveSpeechRequest;
	private SFSpeechRecognizer? speechRecognizer;
	private SFSpeechRecognitionTask? recognitionTask;

	public async Task<string> Listen(CultureInfo culture, IProgress<string>? recognitionResult, CancellationToken cancellationToken)
	{
		speechRecognizer = new SFSpeechRecognizer(NSLocale.FromLocaleIdentifier(culture.Name));

		if (!speechRecognizer.Available)
		{
			throw new ArgumentException("Speech recognizer is not available");
		}

		if (SFSpeechRecognizer.AuthorizationStatus != SFSpeechRecognizerAuthorizationStatus.Authorized)
		{
			throw new Exception("Permission denied");
		}

		audioEngine = new AVAudioEngine();
		liveSpeechRequest = new SFSpeechAudioBufferRecognitionRequest();

#if MACCATALYST
		var audioSession = AVAudioSession.SharedInstance();
		audioSession.SetCategory(AVAudioSessionCategory.Record, AVAudioSessionCategoryOptions.DefaultToSpeaker);

		var mode = audioSession.AvailableModes.Contains("AVAudioSessionModeMeasurement") ? "AVAudioSessionModeMeasurement" : audioSession.AvailableModes.First();
		audioSession.SetMode(new NSString(mode), out var audioSessionError);
		if (audioSessionError != null)
		{
			throw new Exception(audioSessionError.LocalizedDescription);
		}

		audioSession.SetActive(true, AVAudioSessionSetActiveOptions.NotifyOthersOnDeactivation, out audioSessionError);
		if (audioSessionError is not null)
		{
			throw new Exception(audioSessionError.LocalizedDescription);
		}
#endif

		var node = audioEngine.InputNode;
		var recordingFormat = node.GetBusOutputFormat(new UIntPtr(0));
		node.InstallTapOnBus(new UIntPtr(0), 1024, recordingFormat, (buffer, _) =>
		{
			liveSpeechRequest.Append(buffer);
		});

		audioEngine.Prepare();
		audioEngine.StartAndReturnError(out var error);

		if (error is not null)
		{
			throw new ArgumentException("Error starting audio engine - " + error.LocalizedDescription);
		}

		var currentIndex = 0;
		var taskResult = new TaskCompletionSource<string>();
		recognitionTask = speechRecognizer.GetRecognitionTask(liveSpeechRequest, (result, err) =>
		{
			if (err != null)
			{
				StopRecording();
				taskResult.TrySetException(new Exception(err.LocalizedDescription));
			}
			else
			{
				if (result.Final)
				{
					currentIndex = 0;
					StopRecording();
					taskResult.TrySetResult(result.BestTranscription.FormattedString);
				}
				else
				{
					for (var i = currentIndex; i < result.BestTranscription.Segments.Length; i++)
					{
						var s = result.BestTranscription.Segments[i].Substring;
						currentIndex++;
						recognitionResult?.Report(s);
					}
				}
			}
		});

		await using (cancellationToken.Register(() =>
		             {
			             StopRecording();
			             taskResult.TrySetCanceled();
		             }))
		{
			return await taskResult.Task;
		}
	}

	void StopRecording()
	{
		audioEngine?.InputNode.RemoveTapOnBus(new UIntPtr(0));
		audioEngine?.Stop();
		liveSpeechRequest?.EndAudio();
		recognitionTask?.Cancel();
	}
}
```

Similar to `Android` here we also create `SpeechRecognizer` and configure `AudioEngine`. By analogy with `SpeechRecognitionListener` Apple has a method `speechRecognizer.GetRecognitionTask` where the second `Action` parameter contains recognition results.


## Windows

Speech recognizer requires access to a microphone and the Internet (In case you choose online recognition), so add these lines to the `Capabilities` in `Package.appxmanifest`:

```xml
<Capability Name="internetClient" />
<DeviceCapability Name="microphone" />
```

The same as with `Android` and `iOS` we implement `ISpeechToText` interface:

```csharp
public sealed class SpeechToTextImplementation : ISpeechToText
{
	private SpeechRecognitionEngine? speechRecognitionEngine;
	private SpeechRecognizer? speechRecognizer;
	private string? recognitionText;

	public async Task<string> ListenOnline(CultureInfo culture, IProgress<string>? recognitionResult, CancellationToken cancellationToken)
	{
		recognitionText = string.Empty;
		speechRecognizer = new SpeechRecognizer(new Language(culture.IetfLanguageTag));
		await speechRecognizer.CompileConstraintsAsync();

		var taskResult = new TaskCompletionSource<string>();
		speechRecognizer.ContinuousRecognitionSession.ResultGenerated += (s, e) =>
		{
			recognitionText += e.Result.Text;
			recognitionResult?.Report(e.Result.Text);
		};
		speechRecognizer.ContinuousRecognitionSession.Completed += (s, e) =>
		{
			switch (e.Status)
			{
				case SpeechRecognitionResultStatus.Success:
					taskResult.TrySetResult(recognitionText);
					break;
				case SpeechRecognitionResultStatus.UserCanceled:
					taskResult.TrySetCanceled();
					break;
				default:
					taskResult.TrySetException(new Exception(e.Status.ToString()));
					break;
			}
		};
		await speechRecognizer.ContinuousRecognitionSession.StartAsync();
		await using (cancellationToken.Register(async () =>
					 {
						 await StopRecording();
						 taskResult.TrySetCanceled();
					 }))
		{
			return await taskResult.Task;
		}
	}

	private async Task StopRecording()
	{
		try
		{
			await speechRecognizer?.ContinuousRecognitionSession.StopAsync();
		}
		catch
		{
			// ignored. Recording may be already stopped
		}
	}
}
```

## Sample

And the most pleasant step to check that everything works:

```csharp
try
{
	RecognitionText = await speechToText.Listen(CultureInfo.GetCultureInfo("en-us"), new Progress<string>(partialText =>
		{
			RecognitionText += partialText + " ";
		}), cancellationToken);
}
catch (Exception ex)
{
	await Toast.Make(ex.Message).Show(cancellationToken);
}
```

![Windows recognition](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/32/recognition-windows.gif)

The final code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiSpeech){target="_blank"}.

Happy coding and never be alone!