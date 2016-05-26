import React, { Component } from 'react' 
import {
  Animated,
  
} from 'react-native';

export class SlideInView extends Component {
  constructor(props) {
    super();

    this.state = {viewHeight: new Animated.Value(props.visible ? props.height : 0)};
    this.visible = props.visible || false;
  }

  componentWillUpdate(nextProps) {
    if (this.visible !== nextProps.visible) {
      if (nextProps.visible === true) {
        Animated.timing(this.state.viewHeight, {toValue: nextProps.height, duration:200}).start();
      }
      else {
        Animated.timing(this.state.viewHeight,  {toValue: 0, duration:200}).start();
      }
      this.visible = nextProps.visible;
    }
  }

  render() {
    return (
      <Animated.View style={[this.props.style, {overflow:'hidden', height: this.state.viewHeight}]}>
        {this.props.children}
      </Animated.View>
    );
  }
}
