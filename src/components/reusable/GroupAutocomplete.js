import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { Input, Button } from 'reactstrap'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Autosuggest from 'react-autosuggest';
import GroupCard from '../Groups/GroupCard'
import { getGroups } from '../../actions/GroupsActions'
import { formatFirestoreData } from '../../utils/utils'
import { withRouter } from 'react-router-dom'
import { firebaseConnect } from 'react-redux-firebase';

class GroupAutocomplete extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      suggestions: [],
      searchText: '',
      selected: null
    }
  }

  componentDidMount() {
    const { firestore } = this.context.store
    const { fieldState, groups } = this.props

    if(!groups.isLoaded) {
      getGroups(firestore)
    } else {
      const { value } = fieldState

      if(value && value !== '') {
        this.setState({
          selected: groups.data[value]
        })
      }
    }
  }

  componentWillReceiveProps(newProps) {
    if(!this.props.groups.isLoaded && newProps.groups.isLoaded) {
      const { fieldState, groups } = newProps

      const { value } = fieldState

      if(value && value !== '') {
        this.setState({
          selected: groups.data[value]
        })
      }
    }
  }

  getGroupSuggestions = value => {
    const { groups } = this.props

    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : groups.ordered.filter(group =>
      group.name.toLowerCase().slice(0, inputLength) === inputValue
    );
  };

  getSuggestionValue = suggestion => {
    const {
      fieldApi
    } = this.props
    const {
      setValue,
      setTouched
    } = fieldApi;

    setValue(suggestion.id)
    setTouched()

    this.setState({
      selected: suggestion
    })

    return suggestion.name
  };

  renderSuggestion = suggestion => <span className="suggestion-content list-unstyled">
    <GroupCard
      key={suggestion.id}
      group={suggestion}
      groupTypes={this.props.groupTypes}
      hideButtons
    />
  </span>

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getGroupSuggestions(value)
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  inputProps = () => {
    return ({
      placeholder: "Enter an IG or GUI Name",
      value: this.state.searchText,
      onChange: (event, { newValue }) => {
        this.setState({
          searchText: newValue
        });
      }
    })
  }

  renderInputComponent = inputProps => {
    const { selected } = this.state
    const { groups, groupTypes, fieldApi, fieldState } = this.props

    var inputComponents = []

    if(!groups.isLoaded || !groupTypes.isLoaded) {
      inputComponents.push(<FontAwesomeIcon icon="spinner" className="mr-2" spin key="groupLoader" />)
    }

    if(selected && groupTypes.isLoaded) {
      inputComponents.push(
        <GroupCard
          group={selected}
          groupTypes={groupTypes}
          hideButtons
          key={selected.id + 'selected'}
        />)
      inputComponents.push(
        <Button
          color="danger"
          className="mt-2"
          outline
          onClick={() => {
            fieldApi.setValue(null)
            this.setState({
              selected: null,
            })
          }}
          key={fieldState.value.id + 'delete'}>
          <FontAwesomeIcon icon="trash-alt" />
        </Button>)
    } else {
      inputComponents.push(<Input type="text" {...inputProps} disabled={ !groups.isLoaded || !groupTypes.isLoaded } invalid={ this.props.fieldState.error } />)
    }

    return inputComponents
  }

  render() {
    const { suggestions } = this.state

    return(
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={this.inputProps()}
        renderInputComponent={this.renderInputComponent}
      />)
  }
}

const mapStateToProps = state => {
  return {
    groups: formatFirestoreData(state.firestore, 'groups'),
    groupTypes: formatFirestoreData(state.firestore, 'groupTypes')
  }
}

export default withRouter(compose(
  firebaseConnect(),
  connect(mapStateToProps)
)(GroupAutocomplete))