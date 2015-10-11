import React, {Component} from 'react';
import Header from '../header/header';
import Tab from '../editor-tab/tab';
import Pane from '../editor-pane/pane';
import PaneTorrent from '../pane-torrent/torrent';
import TorrentStore from '../store/torrent-store';
import TorcacheStore from '../store/torcache-store';
import { Link } from 'react-router';
import TorrentActionCreator from '../action/torrent-action-creator';
import './editor.scss';

/* global Prism */

const PANE_EDITOR = 0x01;
const PANE_JSON   = 0x02;
//const PANE_RAW    = 0x03;

function parser(key, value) {
  if (key == 'info' || key == 'infoBuffer') { return; }
  else { return value;}
}

export default class Editor extends Component {

  state = {
    pane: PANE_EDITOR,
    torrent: {
      infoHash: null,
      name: null,
      comment: null,
      files: [],
      announce: [],
      pieces: []
    }
  }
  
  componentDidMount() { 
    this.initComponent();

    TorrentStore.sub(this.handleStoreChanged);
    TorcacheStore.sub(this.handleTorcacheChanged);
  }
  
  componentDidUpdate() {
    Prism.highlightElement(this.refs.code);
  }
  
  componentWillUnmount() {
    TorrentStore.off(this.handleStoreChanged);
    TorcacheStore.off(this.handleTorcacheChanged);
  }
  
  handleTabChange(pane, ev) {
    ev.stopPropagation();
    ev.preventDefault();
    
    this.setState({pane});
  }
  
  handleStoreChanged = () => {
    var torrent = TorrentStore.getParsed();
    
    if (!torrent) {
      return TorrentActionCreator.notFound();
    }
    
    this.setState({torrent});
  }
  
  handleTorcacheChanged = () => {
    var torrent = TorcacheStore.getTorrent(this.props.params.hash);
    
    if (!torrent) {
      return TorrentActionCreator.notFound();
    }
    
    this.setState({torrent});
  }
  
  initComponent = () => {
    var torrent = TorrentStore.getParsed();

    /**
     * Для начала проверяем, есть ли запрашиваемый торрент в хранилище
     * Если в D-n-D хранилище нет запрашиваемого торрента,
     * пробуем загрузить с Torcache
     * Если его и там нет - редиректим на 404
     */
    if (!torrent || (torrent.infoHash.toUpperCase() != this.props.params.hash)) {
      let isLoaded = TorcacheStore.isLoaded(this.props.params.hash);
      
      if (!isLoaded) {
        return TorrentActionCreator.pullTorrent(this.props.params.hash);
      }
      
      torrent = TorcacheStore.getTorrent(this.props.params.hash);
      
      // loaded and not found
      if (!torrent) {
        return TorrentActionCreator.notFound();
      }
    }
    
    this.setState({torrent});
  }

  render() {
    var torrent = this.state.torrent;
   
    return (
      <section className='editor'>
        <Link to='/' activeClassName='wrap-heading' >
          <Header />
        </Link>
        <div className='editor-wrap'>
          <div className='editor-tabs'>
            <Tab title='editor' active={this.state.pane == PANE_EDITOR} onClick={this.handleTabChange.bind(this, PANE_EDITOR)} />
            <Tab title='json'   active={this.state.pane == PANE_JSON} onClick={this.handleTabChange.bind(this, PANE_JSON)} />
          </div>
          <div className='editor-panes'>
            <Pane active={this.state.pane == PANE_EDITOR}>
              <PaneTorrent torrent={this.state.torrent} />
            </Pane>
            <Pane active={this.state.pane == PANE_JSON}>
              <pre style={{margin: 0}}>
                <code ref='code' className='language-clike line-numbers'>{JSON.stringify(torrent, parser, 2)}</code>
              </pre>
            </Pane>
          </div>
        </div>
      </section>
    );
  }
}