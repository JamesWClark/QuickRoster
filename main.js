$(document).ready(function() {
    
    var tdata, sdata; // teacher and student data
    
    var totalFiles = 2;
    var loadedFiles = 0;
    
    var progress = 0; // progress on the progress bar
    var progressBar = $('#progress-loading-files'); // the progress bar
    
    var courses = {};
    var students = {};
    var teachers = {};
    
    var csvDownloadData = [];
    
    var teacherEmails = [];
    
    var updateCSVDownloadLink = function(courseID) {
        // http://stackoverflow.com/questions/17103398/convert-javascript-variable-value-to-csv-file
        csvDownloadData = csvDownloadData.join('\n');
        window.URL = window.webkitURL || window.URL;
        var contentType = 'text/csv';
        var csvFile = new Blob([csvDownloadData], { type : contentType});
        $('#download').html('');
        $('#download').append('<a href="' + window.URL.createObjectURL(csvFile) + '" download="' + courseID + '.csv">Download CSV</a>');
    };
    
    window.listStudents = function(id) {
        var course = courses[id];
        var studentList = $('#students');
        studentList.html('');
        csvDownloadData = [];
        
        console.log('listing students from courses[' + id + '] = ' + course.roster);
        
        var html = '<tr><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Email</th></tr>';
        for(var i = 0; i < course.roster.length; i++) {
            var studentID = course.roster[i];
            var student = students[studentID];
            html += '<tr><td>' + student.lname + '</td><td>' + student.fname + '</td><td>' + student.id + '</td><td>' + student.email + '</td></tr>';
            csvDownloadData.push(student.lname + "," + student.fname + "," + student.id + "," + student.email);
        }
        studentList.append(html);
        updateCSVDownloadLink(course.id);
    };
    
    var listCourses = function(email) {
        console.log('listing courses...');
        var teacher;
        for(var prop in teachers) {
            if(teachers.hasOwnProperty(prop)) {
                if(teachers[prop].email === email) {
                    teacher = teachers[prop];
                }
            }
        }
        
        console.log('teacher = ', teacher);
        console.log('courses = ', teacher.courses);

        
        var courseList = $('#courses');
        var html = '<tr><th>Course ID</th><th>Course Name</th><th>Term</th></tr>';
        courseList.html('');
        
        for(var i = 0; i < teacher.courses.length; i++) {
            var course = courses[teacher.courses[i]];
            html += '<tr id="' + courseMapKey(course.id, course.term) + '" onclick="listStudents(this.id);"><td>' + course.id + '</td><td>' + course.name + '</td><td>' + course.term + '</td></tr>';
        }
        
        courseList.append(html);
    };
    
    var courseMapKey = function(id, term) {
        return id.trim().replace(' - ', '_').trim() + 't' + term.trim();
    };
    
    var parseTeachersTSV = function(data) {
        console.log('parsing teachers.tsv');
        data = data.split('\n');
        for(var i = 1; i < data.length; i++) { // from i = 1 ignores header row
            if(data[i].length > 0) {
                var tsv = data[i].split('\t');

                var teacher = {
                    lname:    tsv[0],
                    fname:    tsv[1],
                    fullName: tsv[2],
                    email:    tsv[3],
                    id:       tsv[4]
                };

                var course = {
                    id:   tsv[5],
                    name: tsv[6],
                    term: tsv[7]
                };
                
                if(!teachers.hasOwnProperty(teacher.id.toString())) {
                    teacher.courses = [];
                    teacher.courses.push(courseMapKey(course.id, course.term));
                    teachers[teacher.id.toString()] = teacher;
                    teacherEmails.push(teacher.email);
                } else {
                    teacher = teachers[teacher.id.toString()];
                    teacher.courses.push(courseMapKey(course.id, course.term));                    
                }
                
                if(!courses.hasOwnProperty(courseMapKey(course.id, course.term))) {
                    console.log("error? course didn't exist when parsing teacher", course.id);
                    course = courses[courseMapKey(course.id, course.term)];
                    course.teacher = teacher.id;
                }
            }
        }
    };
    
    var parseStudentsTSV = function(data) {
        console.log('parsing students.tsv');
        data = data.split('\n');
        for(var i = 1; i < data.length; i++) { // from i = 1 ignores header row
            if(data[i].length > 0) {
                var tsv = data[i].split('\t');
                
                var student = {
                    lname: tsv[0],
                    fname: tsv[1],
                    email: tsv[2],
                    id:    tsv[3],
                    grade: tsv[4]
                };
                
                var course = {
                    id:    tsv[5],
                    term:  tsv[6],
                    name:  tsv[7],
                    teacher: -1
                };
                
                // if student doesn't exist yet, create it
                if(!students.hasOwnProperty(student.id.toString())) {
                    students[student.id.toString()] = student;
                }
                
                // if course doesn't exist yet, create it
                if(!courses.hasOwnProperty(courseMapKey(course.id, course.term))) {
                    course.roster = []
                    course.roster.push(student.id.toString());
                    courses[courseMapKey(course.id, course.term)] = course;
                } else {
                    // course already exists, add student to course
                    course = courses[courseMapKey(course.id, course.term)];
                    if(course.roster.indexOf(student.id.toString()) === -1) {
                        course.roster.push(student.id.toString());
                    }
                }
            }
        }
    };
    
    // when loading and parsing is complete
    var next = function() {
        console.log('next');
        console.log(students);
        console.log(courses);
        console.log(teachers);
    };
    
    // update the progress bar
    var updateProgress = function() {
        progress += 100 / (totalFiles * 2); // loading + parsing = 2
        progressBar.attr('value', progress);
    };
    
    // track data file progress
    var handleParse = function() {
        loadedFiles++;
        updateProgress();
        
        if(loadedFiles === totalFiles) {
            
            parseStudentsTSV(sdata);
            updateProgress();
            
            parseTeachersTSV(tdata);
            updateProgress();
            
            next();
        }
    };

    // get teacher data from tsv file
    $.get('data/teachers.tsv', function(data) {
        console.log('fetching teacher data');
        tdata = data;
        handleParse();
    });

    // get student data from tsv file
    $.get('data/students.tsv', function(data) {
        console.log('fetching student data');
        sdata = data;
        handleParse();
    });
    
    // filter search results
    var filterByStartingSubstring = function(substring) {
        return function(element) {
            return element.indexOf(substring) === 0;
        };
    };
    
    // update search results by filter with text input
    $('#search').keyup(function() {
        var substring = $(this).val();
        var filter = teacherEmails.filter(filterByStartingSubstring(substring));
        if(filter.length === 1) {
            var email = filter[0];
            console.log('filtered an email: ' + email);
            $('#teacher').text(email);
            listCourses(email);
        }
    });
});
