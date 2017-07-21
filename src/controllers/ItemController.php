<?php

namespace bscheshirwork\gui\controllers;

use Yii;
use yii\base\InvalidConfigException;
use yii\db\ActiveRecord;
use yii\filters\ContentNegotiator;
use yii\filters\VerbFilter;
use yii\web\BadRequestHttpException;
use yii\web\Controller;
use yii\web\NotFoundHttpException;
use yii\web\Response;

/**
 * Class ItemController
 * Represent class for work with CRUD operations by Item
 */
class ItemController extends Controller
{
    /**
     * @inheritdoc
     */
    public function behaviors()
    {
        return [
            'contentNegotiator' => [
                'class' => ContentNegotiator::className(),
                'formats' => [
                    'application/json' => Response::FORMAT_JSON,
                ],
            ],
            'verbs' => [
                'class' => VerbFilter::className(),
                'actions' => [
                    'save' => ['post'],
                    'delete' => ['post'],
                    'add-child' => ['post'],
                    'remove-child' => ['post'],
                ],
            ],

        ];
    }

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

    /**
     * @return object|ActiveRecord
     * @throws InvalidConfigException
     */
    public function getRelationModel()
    {
        try {
            return Yii::createObject([
                'class' => $this->module->relationModel,
            ]);
        } catch (\ReflectionException $exception) {
            throw new InvalidConfigException('Please check "relationModel" into "' . $this->module->id . '" config');
        }
    }

    /**
     * form pk condition from data
     * @param array|null $data
     * @return array|null
     */
    public function pkCondition(?array $data = null): ?array
    {
        $model = $this->getMainModel();
        $primaryKey = $model->tableSchema->primaryKey;

        $condition = [];
        foreach ($primaryKey as $pk) {
            if (empty($data[$pk] ?? null)) {
                $condition = null;
                break;
            }
            $condition[] = [$pk => $data[$pk] ?? null];
        }
        return $condition;
    }

    /**
     * Load pk condition from form
     * @return array|bool
     */
    public function loadPkCondition(): ?array
    {
        $model = $this->getMainModel();
        $formName = $model->formName();
        return $this->pkCondition(Yii::$app->request->post()[$formName] ?? null);
    }

    /**
     * Returns an array of nodes and links by them
     * @return array
     * @throws InvalidConfigException
     */
    public function actionList()
    {
        $model = $this->getMainModel();
        $primaryKey = $model->tableSchema->primaryKey;
        $relationModel = $this->getRelationModel();

        $nodes = [];
        $index = 0;
        $indexList = [];
        foreach ($model::find()->each() as $itemModel){
            $nodes[$index] = $itemModel;
            $key = '';
            foreach ($primaryKey as $pk) {
                $key .= '|' . $itemModel->$pk;
            }
            $indexList[$key] = $index;
            $index++;
        }
        $links = [];
        foreach ($relationModel::find()->each() as $link) {
            $keyParent = $keyChild = '';
            foreach ($primaryKey as $pk) {
                $keyParent .= '|' . $link->{'parent' . ucfirst($pk)};
                $keyChild .= '|' . $link->{'child' . ucfirst($pk)};
            }
            $links[] = [
                'source' => $indexList[$keyParent],
                'target' => $indexList[$keyChild],
            ];
        }

        return ['nodes' => $nodes, 'links' => $links];
    }

    /**
     * Finds the main model based on its primary key value.
     * If the model is not found, a 404 HTTP exception will be thrown.
     * @param array $idCondition
     * @param null|string $getterName name of getter to return model class or object
     * @return ActiveRecord the loaded model
     * @throws NotFoundHttpException if the model cannot be found
     */
    protected function findModel(array $idCondition, ?string $getterName = null)
    {
        $model = $this->{$getterName ?? 'mainModel'};
        if (($model = $model::findOne($idCondition)) !== null) {
            return $model;
        } else {
            throw new NotFoundHttpException('The requested item does not exist.');
        }
    }

    /**
     * Action of create or update a item(role or permission).
     **/
    public function actionSave()
    {
        $model = $this->getMainModel();

        if (!empty($condition = $this->loadPkCondition())) {
            $model = $this->findModel($condition);
        }
        $isNew = $model->isNewRecord;

        if (!$model->load(Yii::$app->request->post())) {
            Yii::$app->response->setStatusCode(406);
            return ['errors' => ['Wrong Post data']];
        }

        if (!$model->save()) {
            Yii::$app->response->setStatusCode(406);
            return ['errors' => $model->getErrors()];
        }

        return ['item' =>$model, 'isNew' => $isNew];
    }

    /**
     * Delete item.
     * @return boolean
     * @throws BadRequestHttpException
     */
    public function actionDelete()
    {
        if (!empty($condition = $this->loadPkCondition())) {
            return (bool)$this->findModel($condition)->delete();
        } else {
            throw new BadRequestHttpException('The POST param(s) of item pk has missed.');
        }
    }

    /**
     * Adds a child item to a parent item.
     * @return boolean
     * @throws BadRequestHttpException
     */
    public function actionAddChild()
    {
        ['parent' => $parent, 'child' => $child] = $this->getSourceAndTarget();

        $model = $this->getMainModel();
        $primaryKey = $model->tableSchema->primaryKey;
        $relationModel = $this->getRelationModel();
        foreach ($primaryKey as $pk) {
            $relationModel->{'parent' . ucfirst($pk)} = $parent->$pk;
            $relationModel->{'child' . ucfirst($pk)} = $child->$pk;
        }
        try {
            return $relationModel->save();
        } catch (\PDOException $e) {
            throw new BadRequestHttpException('Save failure ' . $e->getMessage());
        }
    }

    /**
     * Removes a child item from a parent item.
     * @return boolean
     */
    public function actionRemoveChild()
    {
        ['parent' => $parent, 'child' => $child] = $this->getSourceAndTarget();

        $model = $this->getMainModel();
        $primaryKey = $model->tableSchema->primaryKey;
        $condition = [];
        foreach ($primaryKey as $pk) {
            $condition['parent' . ucfirst($pk)] = $parent->$pk;
            $condition['child' . ucfirst($pk)] = $child->$pk;
        }
        return (bool)$this->findModel($condition, 'relationModel')->delete();
    }

    /**
     * Returns source and target
     * The helper method for actionAddChild & actionRemoveChild.
     * @return array of source and target.
     * @throws BadRequestHttpException
     * @throws NotFoundHttpException
     */
    protected function getSourceAndTarget()
    {
        $post = Yii::$app->getRequest()->post();
        if (($parentCondition = $this->pkCondition($post['source'])) && ($childCondition = $this->pkCondition($post['target']))) {
            return ['parent' => $this->findModel($parentCondition), 'child' => $this->findModel($childCondition)];
        }
        throw new BadRequestHttpException('The POST "source" and "target" params has missed.');
    }
}