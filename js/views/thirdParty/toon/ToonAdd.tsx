import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View
} from 'react-native';
import { Background } from "../../components/Background";
import { colors, OrangeLine, screenHeight, screenWidth, tabBarHeight } from "../../styles";
import { deviceStyles } from "../../deviceViews/DeviceOverview";
import { toonConfig } from "../../../sensitiveData/toonConfig";
import { NativeBus } from "../../../native/libInterface/NativeBus";
import { CLOUD } from "../../../cloud/cloudAPI";
import { Actions } from 'react-native-router-flux';
import {ScaledImage} from "../../components/ScaledImage";
import {TextEditInput} from "../../components/editComponents/TextEditInput";
import {LOGe} from "../../../logging/Log";


export class ToonAdd extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Toon" }
  };


  unsubscribeNativeEvent : any;

  constructor(props) {
    super(props);

    this.state = {
      processing: false,
      failed:     false,
      success:    false,
      manualCodeInput: false,
      code:       null,
      codeInput:  '',
    }

    this.unsubscribeNativeEvent = NativeBus.on(NativeBus.topics.callbackUrlInvoked, (url) => {
      this.setState({processing: true});
      this.process(url);
    });

  }


  process(url) {
    let codeExtractRegex = /code=(.*?)&/gm;
    let result = codeExtractRegex.exec(url);
    if (!result || result.length != 2) { return this.setState({failed: true}); }

    let code = result[1];

    this.pairWithToon(code);
  }

  pairWithToon(code) {
    let accessTokens : any = {};
    let agreementIds : any = {};
    CLOUD.thirdParty.toon.getAccessToken(code)
      .then((data) => {
        if (data.status === 200) {
          accessTokens = data.data;
          return CLOUD.thirdParty.toon.getToonIds(accessTokens.access_token);
        }
        else {
          throw {code: 1, message: "Failed to get AccessToken"};
        }
      })
      .then((data) => {
        if (data.status === 200) {
          agreementIds = data.data;
          this.props.store.dispatch({type:"REMOVE_ALL_TOONS", sphereId: this.props.sphereId});

          return CLOUD.forSphere(this.props.sphereId).thirdParty.toon.deleteToonsInCrownstoneCloud(false)
        }
        else {
          throw  {code: 1, message: "Failed to get agreementIds"};
        }
      })
      .then(() => {
        let actions = [];
        let promises = [];
        agreementIds.forEach((agreementId) => {
          promises.push(
            CLOUD.forSphere(this.props.sphereId).thirdParty.toon.createToonInCrownstoneCloud({
              refreshToken: accessTokens.refresh_token,
              toonAgreementId: agreementId.agreementId,
              toonAddress: agreementId.street + " " + agreementId.houseNumber
            }, false)
              .then((toon) => {
                actions.push({
                  type: "ADD_TOON",
                  sphereId: this.props.sphereId,
                  toonId: agreementId.agreementId,
                  data: {
                    enabled: true,
                    toonAgreementId: agreementId.agreementId,
                    toonAddress: agreementId.street + " " + agreementId.houseNumber,
                    schedule: toon.schedule
                  }
                })
              })
          )
        })
        return Promise.all(promises).then(() => { this.props.store.batchDispatch(actions) })
      })
      .then(() => {
        if (agreementIds.length === 0) {
          Alert.alert("No Toon Found","This account does not seem to have a Toon we can use....",[{text:'OK'}])
        }
        else {
          this.setState({success:true, processing:false}, () => {
            setTimeout(() => {
              if (agreementIds.length > 1) {
                Actions.toonOverview({sphereId: this.props.sphereId,  __popBeforeAddCount: 1})
              }
              else {
                Actions.toonSettings({sphereId: this.props.sphereId, toonId: agreementIds[0].agreementId, __popBeforeAddCount: 1})
              }
            }, 1500);
          })
        }
      })
      .catch((err) => {
        LOGe.info("ToonAdd: Error while adding Toon.", err);
        if (err && typeof err === 'object' && err.code) {
          if (err.code === 1 && this.state.code) {
            Alert.alert("Whoops", "The provided code seems to be incorrect.", [{text:'OK'}]);
            return;
          }
        }

        Alert.alert("Whoops", "Something went wrong... Please try again later.", [{text:'OK'}]);
      })
  }

  componentWillUnmount() {
    this.unsubscribeNativeEvent();
  }

  _getItems() {
    let items = [];
    return items;
  }

  _getText() {
    let text = '';
    if (this.state.failed) {
      text = "Failed to connect :(";
    }
    else if (this.state.success) {
      text = "Success!"
    }
    else if (this.state.manualCodeInput && this.state.code === null) {
      text = "Paste the code from the Crownstone website in the box above and press submit.";
    }
    else if (this.state.processing) {
      text = "Connecting to Toon... This shouldn't take long!";
    }
    else {
      text =  "When you integrate your Toon with Crownstone, you can use the indoor localization together with your heating!";
    }

    return (
      <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{text}</Text>
    );
  }

  _getButton() {
    if (this.state.failed || this.state.success) {
      return null;
    }
    if (this.state.manualCodeInput && this.state.code === null) {
      return (
        <TouchableOpacity onPress={() => { this.setState({code: this.state.codeInput }); this.pairWithToon(this.state.codeInput); }} style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.hex, alignItems:'center', justifyContent:'center'}}>
          <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"Submit"}</Text>
        </TouchableOpacity>
      );
    }
    else if (this.state.processing && this.state.code !== null) {
      return (
        <View style={{alignItems:'center', justifyContent:'center'}}>
          <View style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.rgba(0.3), alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18, color: colors.menuBackground.rgba(0.3), fontWeight: 'bold'}}>{"Working...."}</Text>
          </View>
        </View>
      );
    }
    else if (this.state.processing) {
      return (
        <View style={{alignItems:'center', justifyContent:'center'}}>
          <View style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.rgba(0.3), alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18, color: colors.menuBackground.rgba(0.3), fontWeight: 'bold'}}>{"Working...."}</Text>
          </View>

          <TouchableOpacity style={{paddingTop:15}} onPress={() => { this.setState({ manualCodeInput:true })}}>
            <Text style={{fontSize:15, color: colors.menuBackground.rgba(0.3), textAlign:'center'}}>{"If something went wrong, tap here if you want to manually input the code."}</Text>
          </TouchableOpacity>
        </View>
      )
    }
    else {
      return (
        <TouchableOpacity onPress={() => {
          Linking.openURL('https://api.toon.eu/authorize?response_type=code&client_id=' + toonConfig.clientId).catch(() => {})
        }} style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.hex, alignItems:'center', justifyContent:'center'}}>
          <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"Connect with Toon!"}</Text>
        </TouchableOpacity>
      );
    }
  }

  _getExplanation() {
    if (!this.state.success && !this.state.processing && !this.state.failed) {
     return (
       <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{
         "Sometimes, Toon is set to \"Away\" while you're still there...\n\n... but Crownstone can ensure that it is set to \"Home\" as long as you're home!"
       }</Text>
     )
    }
  }

  _getDisclaimer() {
      if (!this.state.success && !this.state.processing && !this.state.failed) {
       return (
         <Text style={{
           textAlign: 'center',
           fontSize: 12,
           color: colors.black.rgba(0.6),
           paddingTop: 10
         }} >{"This application uses the Toon API, follows the guiding principles for using the Toon API, but has not been developed by Toon."}
         </Text>
       )
      }
    }

  render() {
    let content;
    if (this.state.manualCodeInput) {
      content = (
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <View style={{flex:1}} />
          <ScaledImage source={require('../../../images/thirdParty/logo/Works-with-Toon.png')} targetWidth={0.6*screenWidth} sourceWidth={535} sourceHeight={140} />
          <View style={{flex:0.75}} />
          <View style={{width: 250, height: 60, backgroundColor:"#fff", borderRadius:20, borderWidth: 2, borderColor: colors.gray.rgba(0.5), alignItems:'center', justifyContent:'center'}}>
            <TextEditInput
              style={{width: 0.8*screenWidth, padding:10, fontSize:26, fontWeight:'bold', textAlign:"center"}}
              placeholder='paste code'
              placeholderTextColor='#ccc'
              autoCorrect={false}
              value={this.state.codeInput}
              callback={(newValue) => { this.setState({codeInput:newValue});}}
            />
          </View>
          <View style={{flex:0.75}} />
          { this._getText() }
          <View style={{flex:0.75}} />
          { this._getButton() }
          <View style={{flex:0.5}} />
        </View>
      );
    }
    else {
      content = (
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <View style={{flex:1}} />
          <ScaledImage source={require('../../../images/thirdParty/logo/Works-with-Toon.png')} targetWidth={0.6*screenWidth} sourceWidth={535} sourceHeight={140} />
          { this.state.processing ?  <View style={{paddingTop:50, alignItems:'center', justifyContent:'center'}}><ActivityIndicator animating={true} size="large" /></View> : undefined}
          <View style={{flex:1}} />
          { this._getText() }
          <View style={{flex:0.75}} />
          { this._getExplanation() }

          {!this.state.processing && !this.state.failed ? <View style={{flex:1}} /> : <View style={{flex:0.5}} /> }
          { this._getButton() }
          { this._getDisclaimer() }
          <View style={{flex:0.5}} />
        </View>
      );
    }

    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        { content }
      </Background>
    );
  }
}
