
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SwitchCraftInformation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { colors, screenWidth, OrangeLine, styles } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import {ScaledImage} from "../../components/ScaledImage";


export class SwitchCraftInformation extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Switchcraft"),
    }
  };
  // "SwitchCraft is a new, experimental feature of the Crownstone that allows you to switch your lights with both Crownstone and an existing wall switch." +
  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.menu}>
        <OrangeLine/>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../images/switchCraft/switchCraftText.png')} sourceWidth={1000} sourceHeight={161} targetWidth={0.75*screenWidth} />
            <View style={{height:40}} />
            <IconButton name="md-power" buttonSize={80} size={60} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />
            <View style={{height:10}} />
            <Text style={styles.explanation}>{ lang("Switchcraft_is_a_new__exp") }</Text>
            <ScaledImage source={require('../../../images/switchCraft/switchCraft_normal_before.png')} sourceWidth={752} sourceHeight={563} targetWidth={0.75*screenWidth} />
            <Text style={styles.explanation}>{ lang("The_symbols_shown_have_th") }</Text>
            <View style={{flexDirection:'row', paddingTop:20}}>
              <View style={{flex:1}} />
              <View style={styles.centered}><ScaledImage source={require('../../../images/switchCraft/legend/lamp.png')} sourceWidth={97} sourceHeight={97} targetWidth={0.1*screenWidth} /><Text style={styles.legendText}>{ lang("Lamp") }</Text></View>
              <View style={{flex:1}} />
              <View style={styles.centered}><ScaledImage source={require('../../../images/switchCraft/legend/powerSupply.png')} sourceWidth={81} sourceHeight={81} targetWidth={0.1*screenWidth} /><Text style={styles.legendText}>{ lang("Mains") }</Text></View>
              <View style={{flex:1}} />
              <View style={styles.centered}><ScaledImage source={require('../../../images/switchCraft/legend/switch.png')} sourceWidth={110} sourceHeight={110} targetWidth={0.1*screenWidth} /><Text style={styles.legendText}>{ lang("Switch") }</Text></View>
              <View style={{flex:1}} />
              <View style={styles.centered}><ScaledImage source={require('../../../images/switchCraft/legend/builtinCrownstone.png')} sourceWidth={119} sourceHeight={73} targetWidth={0.1*screenWidth} /><Text style={styles.legendText}>{ lang("Built_in_nCrownstone") }</Text></View>
              <View style={{flex:1}} />
            </View>
            <Text style={styles.explanation}>{ lang("After_installing_the_buil") }</Text>
            <ScaledImage source={require('../../../images/switchCraft/switchCraft_normal_after.png')} sourceWidth={1001} sourceHeight={590} targetWidth={0.85*screenWidth} />
            <Text style={styles.explanation}>{ lang("The_adaptation_in_the_ima") }</Text>
            <ScaledImage source={require('../../../images/switchCraft/pre_sluusje_edit_small.png')} sourceWidth={1031} sourceHeight={1000} targetWidth={0.8*screenWidth} />
            <Text style={styles.explanation}>{ lang("At_the_top__where_the_bro") }</Text>
            <ScaledImage source={require('../../../images/switchCraft/post_sluusje_edit_small.png')} sourceWidth={1262} sourceHeight={1000} targetWidth={0.8*screenWidth} />
            <Text style={styles.explanation}>{ lang("Thats_all__When_youre_goi") }</Text>
            <Text style={styles.header}>{ lang("Enjoy_Switchcraft_") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}