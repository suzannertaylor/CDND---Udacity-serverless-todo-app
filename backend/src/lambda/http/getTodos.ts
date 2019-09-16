import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { parseUserId } from '../../auth/utils'

const docClient = new DocumentClient()

const todosTable = process.env.TODOS_TABLE
const userIdIndex = process.env.TODO_USER_ID_INDEX

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
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({items: result.Items})
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
