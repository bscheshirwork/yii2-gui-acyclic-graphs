<?php

use bscheshirwork\gui\Module;
use yii\db\ActiveRecord;
use yii\helpers\Html;
use yii\widgets\ActiveForm;
use yii\helpers\Json;
use yii\web\View;

/* @var $this View */
/* @var $model ActiveRecord */

/**
 * Uses in app.js
 * Must be redefine in user view
 */
$modelOptions = Json::encode([
    'pk' => $primaryKey = $model->tableSchema->primaryKey, //i.e. [0 => 'id']
    'title' => 'name',
    'formSelector' => '#mainForm',
    'formButtonsSelectors' => [
        'delete' => '#deleteForm',
        'submit' => '#submitForm',
    ],
    'formElementsSelectors' => [
        'id' => '#' . HTML::getInputId($model, 'id'),
        'name' => '#' . HTML::getInputId($model, 'name'),
        'description' => '#' . HTML::getInputId($model, 'description'),
    ],
]);
$jsFunction = new yii\web\JsExpression(<<<JS
tipFunction = function (d) {
    return "" +
    "<strong class='text-success'>{$model->getAttributeLabel('name')}:</strong> <span>" + d . name + "</span><br>" +
    "<strong class='text-success'>{$model->getAttributeLabel('description')}:</strong> <span>" + d . description + "</span><br>";
}
JS
);
$this->registerJs("var modelOptions = $modelOptions; \n$jsFunction", View::POS_BEGIN);

?>
<h4 class="page-header"><?= Module::t('form', 'A form to create-update-delete') ?></h4>

<?php $form = ActiveForm::begin([
    'id' => "mainForm",
    'enableClientScript' => true,
]); ?>

<?= $form->field($model, 'id')->textInput(['readonly' => 'readonly']) ?>

<?= $form->field($model, 'name')->textInput(['maxlength' => 64]) ?>

<details class="form-group">
    <summary><?= Module::t('form', 'Additional attributes') ?></summary>

    <?= $form->field($model, 'description')->textarea(['rows' => 2]) ?>

</details>

<?= $form->errorSummary($model); ?>

<div class="form-group">
    <?=
    Html::button(
        Module::t('form', 'Save'),
        [
            'class' => $model->isNewRecord ? 'btn btn-success' : 'btn btn-primary',
            'id' => 'submitForm',
        ]
    )
    ?>
    <button type="reset" class="btn btn-default"><?= Module::t('form', 'Reset form') ?></button>
    <button type="button" class="btn btn-danger" id="deleteForm"><?= Module::t('form', 'Delete item') ?></button>
</div>

<?php ActiveForm::end(); ?>
