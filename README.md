## Graph for parent-child representation relations on self-relates activeRecord

i.e. for next composition
```php
/**
 * @property MainModel[] $parents
 * @property MainModel[] $childs
 */
class MainModel extends \yii\db\ActiveRecord
{
    var $id;
}
/**
 * @property MainModel $parent
 * @property MainModel $child
 */
class RelationModel extends \yii\db\ActiveRecord
{
    var $parentId;
    var $childId;
}
```

via table property can be prefixed `parent`, `child`, can accept complex pk;

graphical representation and actions:

![default](https://user-images.githubusercontent.com/5769211/28467279-0840024e-6e38-11e7-9ac4-cc7f7b5f15f1.png)

similar at [githubjeka/yii2-gui-rbac](https://github.com/githubjeka/gui-rbac-yii2)

![http://i.imgur.com/BXTKymp.jpg](http://i.imgur.com/BXTKymp.jpg)

## How to install

Follow the commands: 
- Add to your composer.json `"bscheshirwork/yii2-gui-acyclic-graphs": "*@dev"`
- Run `composer update`
- Add to `config` the code:
```php
// '/config/web.php' for Basic or '/backend/config/main' - Advanced Yii2 application.
'modules' => [
    'gui' => [
        'class' => 'bscheshirwork\gui\Module',
        'as access' => [ // if you need to set access
            'class' => 'yii\filters\AccessControl',
            'rules' => [
                [
                    'allow' => true,
                    'roles' => ['@'] // all auth users 
                ],
            ],
            'mainModel' => 'common\models\MainModel', // model, who have relations. (rectangles)
            'mainModelFormView' => '@backend/views/main-model/_form-gui', //Active form for MainModel. See @vendor/bscheshirwork/yii2-gui-acyclic-graphs/src/views/default/_form
            'relationModel' => 'common\models\RelationModel', // via model (arrows)
        ],
    ],
],
```
- go to url `/index.php?r=gui`
