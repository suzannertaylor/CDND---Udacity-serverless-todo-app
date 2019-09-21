import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { parseUserId } from '../../auth/utils'


const docClient = new DocumentClient()

const todosTable = process.env.TODOS_TABLE
const userIdIndex = process.env.TODO_USER_ID_INDEX
const imagesTable = process.env.IMAGES_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[(split.length - 1)]
  const userId = parseUserId(jwtToken)

  const result = await docClient.query({
    TableName : todosTable,
    IndexName : userIdIndex,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
        ':userId': userId
    }
  }).promise()

  if (result.Count !== 0) {
    const res = result.Items
    console.log(res)
    const items = await Promise.all(res.map(async item => {
      console.log(item)
      let images = await getImagesPerTodo(item.todoId)
      console.log('images', images)
      if (images) {
        const attachmentUrl = images[0].attachmentUrl ? images[0].attachmentUrl : (images[0].imageUrl ? images[0].imageUrl : null)
        if (attachmentUrl) {
          item.attachmentUrl= attachmentUrl
        }
      }
      return item
    }))

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({items: items})
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({items: []})
  }

}

async function getImagesPerTodo(todoId: string) {
  const result = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'todoId = :todoId',
    ExpressionAttributeValues: {
      ':todoId': todoId
    },
    ScanIndexForward: false
  }).promise()

  if(result.Count !== 0) {
    return result.Items
  }

  return false
}