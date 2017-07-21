<?php

use bscheshirwork\gui\Module;
use yii\db\ActiveRecord;
use yii\helpers\Json;
use yii\helpers\Url;
use yii\web\View;

/* @var $this View */
/* @var $model ActiveRecord */

$routes = Json::encode([
    'items' => Url::to(['item/list']),
    'saveItem' => Url::to(['item/save']),
    'deleteItem' => Url::to(['item/delete']),
    'addChild' => Url::to(['item/add-child']),
    'removeChild' => Url::to(['item/remove-child']),
]);
$messages = Json::encode([
    'confirm1' => Module::t('js', 'Are you sure?'),
    'hint1' => Module::t('js', 'To delete an item double-click on him (node)'),
    'caption1' => Module::t('js', 'Mark all'),
    'caption2' => Module::t('js', 'Search by title...'),
]);
$this->registerJs("var routes = $routes; var messages = $messages;", View::POS_BEGIN);
?>
<div class="row">
    <div class="col-md-9">
        <div id="d3container"></div>
        <div class="row search-block">
            <div class="col-md-4">
                <div class="input-group">
                    <input class="form-control" type="search" placeholder="<?= Module::t('main', 'Search for...') ?>" name="search-input">

                    <div class="input-group-btn">
                        <button class="btn btn-default" type="button" name="search-btn">
                            <span class="glyphicon glyphicon-search"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-4">
                <small><?= Module::t('main', 'Double-click on node for delete or update<br>To delete relation double-click on the connection.<br>To connect move node to other node.') ?>
                </small>
            </div>

            <div class="col-xs-8">
                <svg width="100%" height="70px">
                    <g class="legend" transform="translate(16,22)">
                        <path class="linkLegend" d="M 0 7 L 20 7" marker-start="url(#marker)"></path>
                        <text x="22" y="14"><?= Module::t('main', 'Connection item to other item') ?></text>
                    </g>
                    <g class="legend" transform="translate(16,44)">
                        <path class="linkLegend permissionLinkLegend childLinkLegend" d="M 0 7 L 40 7"
                              marker-start="url(#marker)"></path>
                        <text x="45" y="14"><?= Module::t('main', 'Dotted line mean connection child to his parent') ?></text>
                    </g>
                </svg>
            </div>
        </div>
    </div>
    <div class="col-md-3 panel">

        <?= $this->render('_form', [
            'model' => $model,
        ]); ?>

        <h4 class="page-header"><?= Module::t('main', 'Info') ?>
            <small class="sub-header"><?= Module::t('main', 'click on element') ?></small>
        </h4>
        <pre id="infoItem"></pre>
    </div>
</div>
