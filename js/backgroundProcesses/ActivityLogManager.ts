import {eventBus} from "../util/EventBus";
import {LOG} from "../logging/Log";
import {Util} from "../util/Util";
import {transferActivityLogs} from "../cloud/transferData/transferActivityLogs";
import {MapProvider} from "./MapProvider";


class ActivityLogManagerClass {

  _initialized = false
  store = null

  _stagedActions = [];


  loadStore(store) {
    LOG.info('LOADED STORE ActivityLogManager', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      // reset last time fired to 0 so the time diff method will
      this.init();

    }
  }

  init() {
    if (this._initialized === false) {
      eventBus.on("NEW_ACTIVITY_LOG", this._handleActivity.bind(this))
      eventBus.on("disconnect",       this._commit.bind(this));
      this._initialized = true;

    }
  }


  /**
   * {
      command:     "keepAliveState" || "keepAlive" || "multiswitch" || "tap2toggle",
      connectedTo: redux stone Id,
      target:      redux stone Id,
      timeout:     com.timeout,
      intent:      com.timeout,
      changeState: com.changeState,
      state:       com.state
    }
   * @param data
   * @private
   */
  _handleActivity(data) {
    if (data.command) {
      let state = this.store.getState();

      let action = {
        type: "ADD_ACTIVITY_LOG",
        sphereId: data.sphereId,
        stoneId:  data.target,
        logId: Util.getUUID(),
        data: {
          commandUuid: data.commandUuid,
          viaMesh: data.connectedTo !== data.target,
          type: data.command,
          userId: state.user.userId,
          timestamp: new Date().valueOf(),
        }
      }
      let unknownAction = false;
      switch (data.command) {
        case 'keepAliveState':
          action.data["delayInCommand"]  = data.timeout;
          action.data["switchedToState"] = data.changeState ? data.state : -1;
          break;
        case 'multiswitch':
        case 'tap2toggle':
          action.data["delayInCommand"]  = data.timeout;
          action.data["switchedToState"] = data.state;
          action.data["intent"]          = data.intent;
          break;
        case 'keepAlive':
          break;
        default:
          unknownAction = true;
      }

      if (!unknownAction) {
        this._stagedActions.push(action);
      }
    }
  }

  _commit() {
    if (this._stagedActions.length > 0) {
      this.store.batchDispatch(this._stagedActions);

      // @ts-ignore
      let data : [transferNewToCloudStoneData] = [];
      let state = this.store.getState();

      for (let i = 0; i < this._stagedActions.length; i++) {
        let action = this._stagedActions[i];
        let sphere = state.spheres[action.sphereId];
        let stone = sphere.stones[action.stoneId];
        data.push({
          localId: action.logId,
          localData: stone.activityLogs[action.logId],
          localSphereId: action.sphereId,
          localStoneId: action.stoneId,
          cloudStoneId: MapProvider.local2cloudMap.stones[action.stoneId],
        })
      }

      let actions = [];
      transferActivityLogs.batchCreateOnCloud(state,actions, data)
        .then(() => {
          this.store.batchDispatch(actions);
        })
        .catch((err) => {
          this.store.batchDispatch(actions);
        })
    }
    this._stagedActions = [];
  }

}


export const ActivityLogManager = new ActivityLogManagerClass();