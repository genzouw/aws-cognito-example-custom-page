import AWS from 'aws-sdk'
import {
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js'

import $ from 'jquery'
import * as aws from './aws.js'

const poolData = {
  UserPoolId: aws.AWS_COGNITO_USER_POOL_ID,
  ClientId: aws.AWS_COGNITO_APP_CLIENT_ID,
}

const userPool = new CognitoUserPool(poolData)

AWS.config.region = aws.AWS_REGION
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: aws.AWS_COGNITO_ID_POOL_ID,
})

$(() => {
  $("#createAccount").on("click", () => {
    const username = $("#email").val()
    const lastName = $("#lastName").val()
    const firstName = $("#firstName").val()
    const password = $("#password").val()

    signUp(username, password, lastName, firstName, (err) => {
      if (err) {
        alert(err.message)
      } else {
        alert('OK! Please move to next page.')
      }
    })
  })

  // 「Activate」ボタン押下時
  $("#activationButton").click(() => {
    const email = $("#email").val()
    const activationKey = $("#activationKey").val()

    activate(email, activationKey, (err) => {
      if (err) {
        // アクティベーション失敗の場合、エラーメッセージを画面に表示
        if (err.message != null) {
          alert(err.message)
        }
      } else {
        // アクティベーション成功の場合、サインイン画面に遷移
        alert('OK! Please move to next page.')
      }
    })
  })

  // 「Sign In」ボタン押下時
  $("#signinButton").click(() => {
    const email = $('#email').val()
    const password = $('#password').val()
    signIn(email, password, (result) => {
      const idToken = result.getIdToken().getJwtToken() // IDトークン
      const accessToken = result.getAccessToken().getJwtToken() // アクセストークン
      const refreshToken = result.getRefreshToken().getToken() // 更新トークン

      console.log(`idToken : ${idToken}`)
      console.log(`accessToken : ${accessToken}`)
      console.log(`refreshToken : ${refreshToken}`)

      $("#idtoken").val(idToken)
    })
  })
})

/**
 * サインアップ処理。
 */
var signUp = function (username, password, lastName, firstName, callback) {
  // 何か1つでも未入力の項目がある場合、処理終了
  if (!(username && lastName && firstName && password)) {
    return false
  }

  // ユーザ属性リストの生成
  const dataFamilyName = {
    Name: "family_name",
    Value: lastName,
  }
  const dataGivenName = {
    Name: "given_name",
    Value: firstName,
  }
  const attributeFamilyName = new CognitoUserAttribute(dataFamilyName)
  const attributeGivenName = new CognitoUserAttribute(dataGivenName)

  const attributeList = []
  attributeList.push(attributeFamilyName)
  attributeList.push(attributeGivenName)

  // サインアップ処理
  userPool.signUp(username, password, attributeList, null, callback)
}

/**
 * アクティベーション処理
 */
var activate = function (email, activationKey, callback) {
  // 何か1つでも未入力の項目がある場合、処理を中断
  if (!(email && activationKey)) {
    return false
  }

  const userData = {
    Username: email,
    Pool: userPool,
  }
  const cognitoUser = new CognitoUser(userData)

  // アクティベーション処理
  cognitoUser.confirmRegistration(activationKey, true, callback)
}

/**
 * サインイン処理
 */
var signIn = function (email, password, onSuccessCallback) {
  // 何か1つでも未入力の項目がある場合、メッセージを表示して処理を中断
  if (!(email && password)) {
    return false
  }

  // 認証データの作成
  const authenticationData = {
    Username: email,
    Password: password,
  }
  const authenticationDetails = new AuthenticationDetails(authenticationData)

  const userData = {
    Username: email,
    Pool: userPool,
  }
  const cognitoUser = new CognitoUser(userData)

  // 認証処理
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: onSuccessCallback,

    onFailure(err) {
      // サインイン失敗の場合、エラーメッセージを画面に表示
      console.log(err)
      alert(err.message)
    },
  })
}
