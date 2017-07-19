

## How to install

Follow the commands: 
- Add to your composer.json `"bscheshirwork/yii2-gui-acyclic-graphs": "*@dev"`
- Run `composer update`
- Add to `@app/config/main.php` the code:
```php
// '/config/web.php' for Basic or '/backend/config/main' - Advanced Yii2 application.
'modules' => [
  'rbac' => [
    'class' => 'bscheshirwork\gui\Module',
    'as access' => [ // if you need to set access
      'class' => 'yii\filters\AccessControl',
      'rules' => [
          [
              'allow' => true,
              'roles' => ['@'] // all auth users 
          ],
      ]
    ]
  ],
],
```
- go to url `/index.php?r=rbac`
