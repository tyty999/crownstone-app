
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining_finished", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Vibration
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, OrangeLine} from '../../styles'
import { Icon } from '../../components/Icon';

export class RoomTraining_finished extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1}}>
        <OrangeLine/>
        <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'600',
            color: colors.white.hex,
            textAlign:'center'
          }}>{ lang("Finished_learning_about_t") }</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            paddingTop:20,
          }}>{ lang("Once_you_have_taught__all",this.props.ai.name,this.props.ai.he,this.props.ai.his) }</Text>
          <View style={{flex:1}} />
          <TouchableOpacity
            style={[
              {borderWidth:5, borderColor:"#fff", backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth},
              styles.centered
            ]}
            onPress={() => { this.props.quit(); }}
          >
            <Icon name="md-cube" size={0.32*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </View>
    );
  }
}