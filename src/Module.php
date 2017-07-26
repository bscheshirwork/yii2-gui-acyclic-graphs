<?php

namespace bscheshirwork\gui;

use Yii;
use yii\base\InvalidConfigException;

/**
 * Graphical user interface (GUI) module for parent-child
 * Yii2 Module.
 *
 * Using in the your web config:
 * ~~~
 * ```php
 *   'modules' => [
 *       'gui' => [
 *           'class' => 'bscheshirwork\gui\Module',
 *           'as access' => [
 *               'class' => 'yii\filters\AccessControl',
 *               'rules' => [
 *                   ['allow' => true,'roles' => ['@']],
 *               ],
 *           ],
 *           'mainModel' => 'common\models\MainModel', // model, who have relations. (rectangles)
 *           'mainModelFormView' => '@backend/views/main-model/_form-gui', //Active form for MainModel. See @vendor/bscheshirwork/yii2-gui-acyclic-graphs/src/views/default/_form
 *           'relationModel' => 'common\models\RelationModel', // via model (arrows)
 *           'arrowDirection' => bscheshirwork\gui\Module::PARENT_TO_CHILD, // direction of arrow representation
 *       ],
 *   ],
 * ~~~
 *
 * @author Evgeniy Tkachenko <et.coder@gmail.com>
 * @author Bogdan Stepanenko <bscheshir.work@gmail.com>
 */
class Module extends \yii\base\Module
{
    const CHILD_TO_PARENT = 0;
    const PARENT_TO_CHILD = 1;
    /**
     * The main assetBundle for GUI. This asset bundle will be load in main layout.
     * By default AppAsset uses content delivery network (cdnjs.com) for scripts that used in GUI.
     * If you can't use cdn then you should configure own Asset Bundle and set it via this attribute.
     * @see \bscheshirwork\gui\assets\AppAsset to determine the minimum versions of libraries.
     * @var string
     */
    public $mainAssetBundle = 'bscheshirwork\gui\assets\AppAsset';

    public $mainModel = null;

    public $mainModelFormView = '_form';

    public $relationModel = null;

    /**
     * @var int direction for the arrow [0 => child -> parent, 1 => parent -> child]
     */
    public $arrowDirection = self::CHILD_TO_PARENT;

    /**
     * @inheritdoc
     * @throws InvalidConfigException
     */
    public function init()
    {
        parent::init();

        if (empty($this->mainModel)) {
            throw new InvalidConfigException('Please set "mainModel" into "' . $this->id . '" config');
        }
        if (empty($this->mainModelFormView)) {
            throw new InvalidConfigException('Please set "mainModelFormView" into "' . $this->id . '" config');
        }
        if (empty($this->relationModel)) {
            throw new InvalidConfigException('Please set "relationModel" into "' . $this->id . '" config');
        }

        $this->registerTranslations();

    }

    public function registerTranslations()
    {
        Yii::$app->i18n->translations['bscheshirwork/gui/*'] = [
            'class' => 'yii\i18n\PhpMessageSource',
            'sourceLanguage' => 'en-US',
            'basePath' => '@vendor/bscheshirwork/yii2-gui-acyclic-graphs/src/messages',
            'fileMap' => [
                'bscheshirwork/gui/errors' => 'errors.php',
                'bscheshirwork/gui/main' => 'main.php',
                'bscheshirwork/gui/form' => 'form.php',
                'bscheshirwork/gui/js' => 'js.php',
            ],
        ];
    }

    public static function t($category, $message, $params = [], $language = null)
    {
        return Yii::t('bscheshirwork/gui/' . $category, $message, $params, $language);
    }

}