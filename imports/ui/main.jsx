import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { createContainer } from 'meteor/react-meteor-data';
import injectTapEventPlugin from 'react-tap-event-plugin';

import { problem, userData, timer, liveFeed, sapporo } from '../api/db.js';
import {goPage} from './goPage.js'

import AppBar from 'material-ui/lib/app-bar';
import LeftNav from 'material-ui/lib/left-nav';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Divider from 'material-ui/lib/divider';
import DashboardIcon from 'material-ui/lib/svg-icons/action/dashboard';
import Snackbar from 'material-ui/lib/snackbar';

import AdminIcon from 'material-ui/lib/svg-icons/action/settings';
import AboutIcon from 'material-ui/lib/svg-icons/action/code';
import LogoutIcon from 'material-ui/lib/svg-icons/action/exit-to-app';
import NotpassIcon from 'material-ui/lib/svg-icons/image/panorama-fish-eye';
import DoneIcon from 'material-ui/lib/svg-icons/action/check-circle';
import ProblemIcon from 'material-ui/lib/svg-icons/editor/insert-drive-file';
import ChartIcon from 'material-ui/lib/svg-icons/editor/insert-chart';
import ExtensionIcon from 'material-ui/lib/svg-icons/action/extension';
import MessageIcon from 'material-ui/lib/svg-icons/communication/message';
import MailIcon from 'material-ui/lib/svg-icons/communication/mail-outline';
import PowerIcon from 'material-ui/lib/svg-icons/notification/power';

import { getCurrentUserData,  isUserPassedProblem } from '../library/score_lib.js';
import { getNumberOfUnread } from '../library/mail.js';

injectTapEventPlugin(); //Workaround for Meterial-UI with React verion under 1.0

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open : false,
            sectionState: 'login',
            prompt: false,
            mailCount: 0,
            gameEnd: false
        };
    }
    navOpen () {
        if (Meteor.user()) {
            this.setState({open:true});
        }
    }
    navClose () {
        this.setState({open:false});
    }
    logout () {
        Meteor.logout((err)=>{
            this.navClose();
            this.renderPage('login');
            if (err) {
                alert(err);
            }
        });
    }
    renderProblems () {
        let array = this.props._problem;
        array.sort((a, b) => {
            let _a = parseInt(a.score);
            let _b = parseInt(b.score);
            if (_a < _b) {
                return -1;
            } else if (_a > _b) {
                return 1;
            } else {
                return 0;
            }
        });
        return array.map((problem, key) => {
            if (!this.props._timer || !this.props._timer.coding || !Meteor.user()) {
                return ;
            } else {
                let currentUser = null;
                if (Meteor.user()) {
                    currentUser = getCurrentUserData(Meteor.user()._id, this.props._userData);
                }
                let icon = <NotpassIcon />;
                if (isUserPassedProblem(currentUser, problem._id)) {
                    icon = <DoneIcon />;
                }
                return (
                    <MenuItem key={key} leftIcon={icon} onTouchTap={this.goPageWrap.bind(this, 'problemEditor', problem)}
                              primaryText={problem.title} secondaryText={problem.score}/>
                );
            }
        });
    }
    unreadMailCount () {
        let count = getNumberOfUnread(this.props._liveFeed);
        return (count === 0)? '':String(count);
    }
    goPageWrap (page, data) {
        goPage(page, data);
        this.navClose();
    }
    componentDidMount () {
        goPage('login');
    }
    componentDidUpdate () {
        if (!Meteor.user()) {
            this.goPageWrap('login');
        }
        if (this.props._liveFeed.length !== this.state.mailCount) {
            let showPrompt = (this.props._liveFeed.length > this.state.mailCount)? true:false;
            this.setState({
                mailCount: this.props._liveFeed.length,
                prompt: showPrompt
            });
        }
        // Switch to Dashboard when time's up
        if (this.props._timer) {
            if (!(this.props._timer.coding) && !(this.state.gameEnd)) {
                this.setState({
                    gameEnd: true
                });
                goPage('dashboard');
            } else if ((this.props._timer.coding) && (this.state.gameEnd)) {
                this.setState({
                    gameEnd: false
                });
            }
        }
    }
    closePrompt () {
        this.setState({
            prompt: false
        });
    }
    renderAdmin () {
        if (Meteor.user() && Meteor.user().username === 'admin') {
            return (
                <div>
                    <MenuItem>Administrator</MenuItem>
                    <MenuItem leftIcon={<AdminIcon />} onTouchTap={this.goPageWrap.bind(this, 'system')}>System Settings</MenuItem>
                    <MenuItem leftIcon={<ProblemIcon />} onTouchTap={this.goPageWrap.bind(this, 'problemConfig')}>Problem Configuration</MenuItem>
                    <MenuItem leftIcon={<ExtensionIcon />} onTouchTap={this.goPageWrap.bind(this, 'dockerConfig')}>Docker Settings</MenuItem>
                    <MenuItem leftIcon={<ChartIcon />} onTouchTap={this.goPageWrap.bind(this, 'analyse')}>Data Analyse</MenuItem>
                    <MenuItem leftIcon={<MessageIcon />} onTouchTap={this.goPageWrap.bind(this, 'liveFeed')}>Send Mail</MenuItem>
                    <MenuItem leftIcon={<PowerIcon />} onTouchTap={this.goPageWrap.bind(this, 'performance')}>Performance Test</MenuItem>
                    <Divider />
                </div>
            );
        }
    }
    render () {
        return (
            <div>
                <AppBar title={this.props._sapporo? this.props._sapporo.title:''} onLeftIconButtonTouchTap={this.navOpen.bind(this)}>
                </AppBar>
                <Snackbar open={this.state.prompt} message="You've Got New Mail"
                          autoHideDuration={4000} onRequestClose={this.closePrompt.bind(this)}/>
                <LeftNav  docked={false} open={this.state.open}
                          onRequestChange={this.navClose.bind(this)}>
                    <MenuItem leftIcon={<DashboardIcon />} onTouchTap={this.goPageWrap.bind(this, 'dashboard')}>Dashboard</MenuItem>
                    <MenuItem leftIcon={<MailIcon />} onTouchTap={this.goPageWrap.bind(this, 'mailbox')} secondaryText={this.unreadMailCount()}>Inbox</MenuItem>
                    <MenuItem leftIcon={<AboutIcon />} onTouchTap={this.goPageWrap.bind(this, 'about')} >About</MenuItem>
                    <Divider />
                    <MenuItem leftIcon={<LogoutIcon />} onTouchTap={this.logout.bind(this)}>Log Out</MenuItem>
                    <Divider />
                    {this.renderAdmin()}
                    <MenuItem>problem</MenuItem>
                    {this.renderProblems()}
                </LeftNav>
                <div id="section"></div>
            </div>
        );
    }
}


Main.propTypes = {
    _userData: PropTypes.array.isRequired,
    currentUser: PropTypes.object,
    _problem: PropTypes.array.isRequired,
    _liveFeed: PropTypes.array.isRequired,
    _timer: PropTypes.object,
    _sapporo: PropTypes.object
};

export default createContainer(() => {
    Meteor.subscribe('problem');
    Meteor.subscribe('userData');
    Meteor.subscribe('timer');
    Meteor.subscribe('liveFeed');
    Meteor.subscribe('sapporo');
    return {
        currentUser: Meteor.user(),
        _userData: userData.find({}).fetch(),
        _problem: problem.find({}).fetch(),
        _timer: timer.findOne({timeSync: true}),
        _liveFeed: liveFeed.find({}, {sort: {date_created: -1}}).fetch(),
        _sapporo: sapporo.findOne({sapporo:true})
    };
}, Main);
