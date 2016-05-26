import React, { Component } from 'react' 
import {
  
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background }  from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'

import { styles, colors} from '../styles'


export class RoomOverview extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderer(device, index, stoneId) {
    return (
      <View key={stoneId + '_entry'}>
        <View style={styles.listView}>
          <DeviceEntry
            name={device.config.name}
            icon={device.config.icon}
            state={device.state.state}
            currentUsage={device.state.currentUsage}
            navigation={false}
            control={true}
            dimmable={device.config.dimmable}
            onChange={(newValue) => {
              let data = {state:newValue};
              if (newValue === 0)
                data.currentUsage = 0;

              this.props.store.dispatch({
                type: 'UPDATE_STONE_STATE',
                groupId: this.props.groupId,
                locationId: this.props.locationId,
                stoneId: stoneId,
                data: data
              })
            }}
          />
        </View>
      </View>
    );
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const devices = room.stones;

    // update the title in case the editing has changed it
    this.props.navigationState.title = room.config.name;

    let {width} = Dimensions.get('window');
    let pxRatio = PixelRatio.get();
    let height = 50 * pxRatio;

    return (
      <Background background={require('../../images/mainBackground.png')}>
        <RoomBanner presence={[]} usage={512} />
        <ScrollView>
          <SeparatedItemList items={devices} renderer={this._renderer.bind(this)} separatorIndent={false}/>
        </ScrollView>
      </Background>
    );
  }
}
