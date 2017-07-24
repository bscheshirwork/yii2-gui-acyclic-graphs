<?php
namespace bscheshirwork\gui\controllers;

use Yii;
use yii\base\InvalidConfigException;
use yii\db\ActiveRecord;
use yii\web\Controller;

class DefaultController extends Controller
{

    /**
     * @return object|ActiveRecord
     * @throws InvalidConfigException
     */
    public function getMainModel()
    {
        try {
            return Yii::createObject([
                'class' => $this->module->mainModel,
            ]);
        } catch (\ReflectionException $exception) {
            throw new InvalidConfigException('Please check "mainModel" into "' . $this->module->id . '" config');
        }
    }

    public function actionIndex()
    {
        $this->layout = "main.php";
        return $this->render('index', [
            'model' => $this->getMainModel(),
            'formView' => $this->module->mainModelFormView,
        ]);
    }
}