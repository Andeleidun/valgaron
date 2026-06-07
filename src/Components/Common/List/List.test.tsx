import { render } from '@testing-library/react';
import List from './List';
import ListItem from './ListItem';

describe('List primitives', () => {
  test('renders custom list semantics when explicit props are provided', () => {
    const { container } = render(
      <List component="ol" className="custom-list" disablePadding>
        <ListItem component="div" className="custom-item" disablePadding>
          Item
        </ListItem>
      </List>
    );

    expect(container.querySelector('ol.List.custom-list')).toBeInTheDocument();
    expect(
      container.querySelector('div.list-item.custom-item')
    ).toHaveTextContent('Item');
  });

  test('renders default list semantics when optional props are omitted', () => {
    const { container } = render(
      <List>
        <ListItem>Default item</ListItem>
      </List>
    );

    expect(container.querySelector('ul.List')).toBeInTheDocument();
    expect(container.querySelector('li.list-item')).toHaveTextContent(
      'Default item'
    );
  });
});
