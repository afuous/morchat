import 'package:flutter/material.dart';
import 'package:flutter_webview_plugin/flutter_webview_plugin.dart';

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

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return WebviewScaffold(
      url: 'https://bheller.me/morchatmobile.html',
      withZoom: true,
      withLocalStorage: true,
      // https://github.com/fluttercommunity/flutter_webview_plugin/issues/379
      resizeToAvoidBottomInset: true,
    );
  }
}
