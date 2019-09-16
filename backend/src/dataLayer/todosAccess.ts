import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }
  
  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo
  }

  async updateTodo(
    todoId: string,
    todoUpdate: TodoUpdate
  ): Promise<TodoUpdate> {
    var params = {
      TableName: this.todosTable,
      Key:{
          "todoId": todoId
      },
      UpdateExpression: "set info.name=:name, info.dueDate=:dueDate, info.done=:done",
      ExpressionAttributeValues:{
        "name": todoUpdate.name,
        "dueDate": todoUpdate.dueDate,
        "done": todoUpdate.done
      },
      ReturnValues:"UPDATED_NEW"
    }
    
    console.log("Updating the item...");

    await this.docClient.update(params)

    return todoUpdate
  }

  async deleteTodo(
    todoId: string) {

    var params = {
      TableName: this.todosTable,
      Key:{
          "todoId": todoId
      }
    };

    console.log("Attempting a delete...");
    await this.docClient.delete(params).promise()
    return
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
