#!/usr/bin/env node

import { parse, resolver } from 'react-docgen';
import fs from 'fs';
import path from 'path';
import Command from './lib/command.js';
import { readFiles } from 'node-dir';
import Handlebars from 'handlebars';
import Table from 'cli-table';

import pkg from '../package.json' with { type: 'json' };
const table = new Table({
    head: [
        'Path',
        'Components',
        'Status'
    ]
});

Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});
Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
});
Handlebars.registerHelper('gte', function(a, b) {
    return a >= b;
});
Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
});
Handlebars.registerHelper('lte', function(a, b) {
    return a <= b;
});
Handlebars.registerHelper('ne', function(a, b) {
    return a !== b;
});

Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value, 10) + 1;
});

Handlebars.registerHelper('noBackSlash', function(options) {
    var string = options.fn(this);
    return string.replace(/\\/g, '/');
});

Handlebars.registerHelper('nl2br', function(options) {
    var nl2br = (options.fn(this) + '')
        .replace(/\r/g, '') // remove windows-style newlines
        .replace(/\n/g, '<br />'); // keep just unix-style newlines
    
    return new Handlebars.SafeString(nl2br);
});

console.log(`\n\nREACT DOC GENERATOR v${pkg.version}`);
console.log(`by Marcin Borkowski <marborkowski@gmail.com>`);


const templateData = {
    files: [],
    version: pkg.version,
    documentTitle: Command.opts().title
};

const template = Handlebars.compile(`${fs.readFileSync(path.join(__dirname, 'template.handlebars'))}`);

if (Command.args.length !== 1) {
    console.log('Please specify <dir> as the first argument!');
    Command.help();
} else {
    readFiles(
        Command.args[0],
        {
            match: new RegExp('\\.(?:' + Command.opts().extensions.join('|') + ')$'),
            exclude: Command.opts().excludePatterns,
            excludeDir: Command.opts().ignore,
        },
        (err, content, filename, next) => {
            if (err) {
                throw err;
            }

            try {
                let components = parse(content, resolver.findAllExportedComponentDefinitions);
                components = components.map(component => {
                    if (component.description && !component.displayName) {
                        component.title = component.description.match(/^(.*)$/m)[0];
                    } else {
                        component.title = component.displayName;
                    }

                    if (component.description) {
                        component.description = `${component.description}\n\n`;
                    }

                    // validate default values
                    if (component.props) {
                        Object.keys(component.props).forEach(key => {
                            let obj = component.props[key];
                            if (obj.defaultValue) {
                                const isString = ['string', 'enum'].includes(obj.type.name)
                                    && typeof obj.defaultValue.value === 'string';
                                const isInvalidValue = (/[^\w\s.&:\-+*,!@%$]+/igm).test(obj.defaultValue.value);

                                if (obj.type.name === 'func' && ['()=>{}', 'function(){}', 'noop'].includes(obj.defaultValue.value.replace(/\s/g,'')) ) {
                                    obj.defaultValue.value = 'empty function';
                                } else if (isInvalidValue && !isString) {
                                    const valueLen = `${obj.defaultValue.value}`.length;

                                    if (valueLen === 0 && obj.type.name === 'node') {
                                        obj.defaultValue.value = 'empty node'
                                    } else if (valueLen <= 40) {
                                        obj.defaultValue.value = `${JSON.stringify(obj.defaultValue.value)}`;
                                    } else {
                                        obj.defaultValue.value = 'Complex structure. Read Description';
                                    }
                                }
                            }
                            if (obj.description) {
                              obj.description = obj.description.replace(/(^\s+|\s+$)/, '');
                            }
                        });
                    }

                    return component;
                });
                templateData.files.push({ filename, components });
                table.push([
                    filename,
                    components.length,
                    `OK.`
                ]);
            } catch (e) {
                table.push([
                    filename,
                    0,
                    `You have to export at least one valid React Class!`
                ]);
            }

            next();
        },
        err => {
            if (err) {
                throw err;
            }

            if (templateData.files.length === 0) {
                let extensions = Command.opts().extensions.map(ext => {
                    return `\`*.${ext}\``;
                });
                console.log('Warning:', `Could not find any files matching the file type: ${extensions.join(' OR ')}\n`);
            } else {
                console.log(`${table.toString()}\n\n`);
            }

            fs.writeFile(Command.opts().output, template(templateData).trim(), (_err) => {
              if (_err) {
                console.log('Error Writing File', Command.opts().output);
              }
            });
        }
    );
}
