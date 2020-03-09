import 'package:flutter/material.dart';
import 'package:flutter_webview_plugin/flutter_webview_plugin.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:convert';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> with WidgetsBindingObserver {

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging();

  final FlutterLocalNotificationsPlugin _notifications = new FlutterLocalNotificationsPlugin();

  @override
  void initState() {
    super.initState();
    _firebaseMessaging.requestNotificationPermissions();
    _firebaseMessaging.getToken().then((token) {
      FlutterWebviewPlugin().onStateChanged.listen((viewState) {
        if (viewState.type == WebViewState.finishLoad) {
          FlutterWebviewPlugin().evalJavascript('window._mobileDeviceToken = ' + jsonEncode(token) + ';');
        }
      });
    });

    _notifications.cancelAll();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _notifications.cancelAll();
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: WebviewScaffold(
        url: 'https://bheller.me/morchatmobile.html',
        withZoom: true,
        withLocalStorage: true,
        // https://github.com/fluttercommunity/flutter_webview_plugin/issues/379
        resizeToAvoidBottomInset: true,
      ),
    );
  }
}
