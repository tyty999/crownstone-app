import React, { Component } from 'react'
import {
  
  Text,
  View
} from 'react-native';


import { styles, colors} from '../../styles'


export class Explanation extends Component {
  render() {
    if (this.props.below === true) {
      return (
        <View style={{flex:1, backgroundColor: this.props.backgroundColor || 'transparent'}}>
          <View style={[{padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:25}, this.props.style]}>
            <Text style={{fontSize:12, color:'#444'}}>{this.props.text}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{flex:1, backgroundColor: this.props.backgroundColor || 'transparent'}}>
        <View style={[{padding:4, paddingRight:15, paddingLeft: 15, paddingTop:30}, this.props.style]}>
          <Text style={{fontSize:12, color:'#444'}}>{this.props.text}</Text>
        </View>
      </View>
    );
  }
}