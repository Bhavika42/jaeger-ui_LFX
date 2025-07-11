// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { Col, Divider, Row, Tag } from 'antd';
import { LocationDescriptor } from 'history';
import { Link } from 'react-router-dom';

import _sortBy from 'lodash/sortBy';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { IoAlert } from 'react-icons/io5';

import { trackConversions, EAltViewActions } from './index.track';
import * as markers from './ResultItem.markers';
import ResultItemTitle from './ResultItemTitle';
import colorGenerator from '../../../utils/color-generator';
import { formatRelativeDate } from '../../../utils/date';

import { KeyValuePair, Trace } from '../../../types/trace';

import './ResultItem.css';

dayjs.extend(relativeTime);

type Props = {
  durationPercent: number;
  isInDiffCohort: boolean;
  linkTo: LocationDescriptor;
  toggleComparison: (traceID: string) => void;
  trace: Trace;
  disableComparision: boolean;
};

type State = {
  erroredServices: Set<string>;
  numSpans: number;
  numErredSpans: number;
  timeStr: string;
  fromNow: string | boolean;
};

const isErrorTag = ({ key, value }: KeyValuePair<boolean | string>) =>
  key === 'error' && (value === true || value === 'true');
const trackTraceConversions = () => trackConversions(EAltViewActions.Traces);

export default class ResultItem extends React.PureComponent<Props, State> {
  constructor(props: Props, state: State) {
    super(props, state);
    const { startTime, spans } = props.trace;

    const startTimeDayjs = dayjs(startTime / 1000);

    const erroredServices: Set<string> = new Set<string>();

    const numErredSpans = spans.filter(sp => {
      const hasError = sp.tags.some(isErrorTag);
      if (hasError) {
        erroredServices.add(sp.process.serviceName);
      }
      return hasError;
    }).length;

    this.state = {
      numSpans: spans.length,
      timeStr: startTimeDayjs.format('h:mm:ss a'),
      fromNow: startTimeDayjs.fromNow(),
      numErredSpans,
      erroredServices,
    };
  }

  render() {
    const { disableComparision, durationPercent, isInDiffCohort, linkTo, toggleComparison, trace } =
      this.props;
    const { duration, services, startTime, traceName, traceID } = trace;
    return (
      <Link to={linkTo} className="ResultItem" onClick={trackTraceConversions}>
        <div role="button">
             <ResultItemTitle
          duration={duration}
          durationPercent={durationPercent}
          isInDiffCohort={isInDiffCohort}
          linkTo={linkTo}
          toggleComparison={toggleComparison}
          traceID={traceID}
          traceName={traceName}
          disableComparison={disableComparision}
        </div>
        </Link>
        <Link to={linkTo}>
          <Row>
            <Col span={4} className="ub-p2">
              <Tag className="ub-m1" data-testid={markers.NUM_SPANS}>
                {this.state.numSpans} Span{this.state.numSpans > 1 && 's'}
              </Tag>
              {Boolean(this.state.numErredSpans) && (
                <Tag className="ub-m1" color="red">
                  {this.state.numErredSpans} Error{this.state.numErredSpans > 1 && 's'}
                </Tag>
              )}
            </Col>
            <Col span={16} className="ub-p2">
              <ul className="ub-list-reset" data-testid={markers.SERVICE_TAGS}>
                {_sortBy(services, s => s.name).map(service => {
                  const { name, numberOfSpans: count } = service;
                  return (
                    <li key={name} className="ub-inline-block ub-m1">
                      <Tag
                        className="ResultItem--serviceTag"
                        style={{ borderLeftColor: colorGenerator.getColorByKey(name) }}
                      >
                        {this.state.erroredServices.has(name) && (
                          <IoAlert className="ResultItem--errorIcon" />
                        )}
                        {name} ({count})
                      </Tag>
                    </li>
                  );
                })}
              </ul>
            </Col>
            <Col span={4} className="ub-p3 ub-tx-right-align">
              {formatRelativeDate(startTime / 1000)}
              <Divider type="vertical" />
              {this.state.timeStr.slice(0, -3)}&nbsp;{this.state.timeStr.slice(-2)}
              <br />
              <small>{this.state.fromNow}</small>
            </Col>
          </Row>
        </Link>
      </div>
    );
  }
}
